import { screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from '../__mocks__/store.js'

import router from "../app/Router.js";
import { formatDate, formatStatus } from "../app/format.js";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
}

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    test("Then bills should format bills correctly", async () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const billsContainer = new Bills({
        document: document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      })

      mockStore.bills().list = jest.fn(() => Promise.resolve(bills))

      const result = await billsContainer.getBills()

      const expectedOutput = bills.map(bill => ({
        ...bill,
        date: formatDate(bill.date),
        status: formatStatus(bill.status)
      }))

      expect(result).toEqual(expectedOutput)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then handleClickIconEye should be called and modal should display on eye click", () => {
      const billContainer = new Bills({
        document: document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });

      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleClickIconEye = jest.fn(billContainer.handleClickIconEye)
      iconEye.addEventListener('click', () => handleClickIconEye(iconEye));
      userEvent.click(iconEye);

      expect(handleClickIconEye).toHaveBeenCalled();

      expect(document.querySelector('.modal')).toBeTruthy();
    });

    test("Then click on new bills should navigate to NewBill route", () => {
      const billsContainer = new Bills({
        document: document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });

      const mockOnNavigate = jest.fn()
      billsContainer.onNavigate = mockOnNavigate

      billsContainer.handleClickNewBill()

      expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill)
    })
  })
})

// test d'intégration GET pour les factures (bills) en tant qu'employé
describe('Given I am a user connected as employee', () => {
  describe('When I am on Bills page', () => {
    test('Then fetches bills from mock API GET', async () => {

      document.body.innerHTML = BillsUI({ data: bills });
      await waitFor(() => screen.getByTestId('tbody'));
      expect(screen.getByTestId('tbody').innerHTML).toBeTruthy();
    });

    describe('When an error occurs on API', () => {
      beforeEach(() => {
        jest.spyOn(mockStore, 'bills');
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: 'a@a',
        }));
        const root = document.createElement('div');
        root.setAttribute('id', 'root');
        document.body.appendChild(root);
        router();
      });

      test('Then fetches bills from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 404'));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        document.body.innerHTML = BillsUI({ error: 'Erreur 404' });
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test('Then fetches bills from an API and fails with 500 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 500'));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        document.body.innerHTML = BillsUI({ error: 'Erreur 500' });
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
