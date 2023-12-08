/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import mockStore from '../__mocks__/store.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import NewBillUI from "../views/NewBillUI.js";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBill from "../containers/NewBill.js";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });

    const user = {
      type: "Employee",
    }

    window.localStorage.setItem("user", JSON.stringify(user))
    document.body.innerHTML = NewBillUI({});
  })

  describe("When I am on NewBill Page", () => {
    test("Then the form elements should be rendered", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      expect(screen.getByTestId("form-new-bill")).toBeInTheDocument();
      expect(screen.getByTestId("file")).toBeInTheDocument();
      expect(screen.getByTestId("datepicker")).toBeInTheDocument();
      expect(screen.getByTestId("expense-type")).toBeInTheDocument();
      expect(screen.getByTestId("expense-name")).toBeInTheDocument();
      expect(screen.getByTestId("amount")).toBeInTheDocument();
      expect(screen.getByTestId("vat")).toBeInTheDocument();
      expect(screen.getByTestId("pct")).toBeInTheDocument();
      expect(screen.getByTestId("commentary")).toBeInTheDocument();
    });

    describe("When I am uploading a file", () => {
      test("Then it should return false and show alert for invalid file extension", () => {

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => { });

        let fileInput = screen.getByTestId("file");
        fireEvent.change(fileInput, {
          target: {
            files: [new File(["file contents"], "document.pdf", { type: "application/pdf" })],
          },
        });

        const result = newBill.checkFileExtension(fileInput);

        expect(result).toBe(false);
        expect(alertSpy).toHaveBeenCalled();

        alertSpy.mockRestore();
      });

      test("Then it should return true for a valid file extension", () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleChangeFileSpy = jest.spyOn(newBill, "handleChangeFile");
        const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => { });

        let fileInput = screen.getByTestId("file");

        fireEvent.change(fileInput, {
          target: {
            files: [new File(["file contents"], "image.jpg", { type: "image/jpeg" })],
          },
        });

        newBill.handleChangeFile({ preventDefault: jest.fn() });

        const result = newBill.checkFileExtension(fileInput);

        expect(handleChangeFileSpy).toHaveBeenCalled();
        expect(result).toBe(true);

        handleChangeFileSpy.mockRestore();
        alertSpy.mockRestore();
      });


    });

    test("Then it should update fileUrl and fileName on file selection", async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const successfulApiResponse = {
        fileUrl: 'fakeFileUrl',
        key: 'fakeKey',
      };

      const createSpy = jest.spyOn(mockStore.bills(), 'create');
      createSpy.mockImplementation(() => Promise.resolve(successfulApiResponse));

      let fileInput = screen.getByTestId("file");
      fireEvent.change(fileInput, {
        target: {
          files: [new File(["file contents"], "image.jpg", { type: "image/jpeg" })],
        },
      });

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith({
          data: expect.any(FormData),
          headers: {
            noContentType: true,
          },
        });
        expect(newBill.billId).toBe('fakeKey');
        expect(newBill.fileUrl).toBe('fakeFileUrl');
        expect(newBill.fileName).toBe('image.jpg');
      });

      createSpy.mockRestore();
    })
  });
});

describe('Given I am connected as an employee', () => {
  describe('When I complete the requested fields and I submit', () => {
    afterEach(jest.clearAllMocks)
    it('should call updateBill and navigate to Bills route', async () => {
      // Arrange
      const onNavigateMock = jest.fn();
      const newBill = new NewBill({
        document: document,
        onNavigate: onNavigateMock,
        store: mockStore,
        localStorage: localStorageMock,
      });

      const createSpy = jest.spyOn(mockStore.bills(), 'update');

      // Act
      fireEvent.change(screen.getByTestId('expense-type'), { target: { value: 'Hôtel et logement' } });
      fireEvent.change(screen.getByTestId('expense-name'), { target: { value: 'My Expense' } });
      fireEvent.change(screen.getByTestId('amount'), { target: { value: '500' } });
      fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2023-12-31' } });
      fireEvent.change(screen.getByTestId('vat'), { target: { value: '80' } });
      fireEvent.change(screen.getByTestId('pct'), { target: { value: '20' } });
      fireEvent.change(screen.getByTestId('commentary'), { target: { value: 'This is a comment' } });

      await newBill.handleSubmit({
        preventDefault: jest.fn(),
        target: screen.getByTestId('form-new-bill'),
      });

      // Assert
      expect(createSpy).toHaveBeenCalledWith({
        data: JSON.stringify({
          type: 'Hôtel et logement',
          name: 'My Expense',
          amount: 500,
          date: '2023-12-31',
          vat: '80',
          pct: 20,
          commentary: 'This is a comment',
          fileUrl: null,
          fileName: null,
          status: 'pending',
        }),
        selector: null,
      });

      await expect(await createSpy.mock.results[0].value).toEqual({
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "pending",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "commentAdmin": "ok",
        "email": "a@a",
        "pct": 20,
      });

      expect(onNavigateMock).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });

    it('should add a bill to API and fails with 404 message error', async () => {
      const onNavigateMock = jest.fn();
      const newBill = new NewBill({
        document: document,
        onNavigate: onNavigateMock,
        store: mockStore,
        localStorage: localStorageMock,
      });

      const updateSpy = jest.spyOn(mockStore.bills(), 'update').mockRejectedValueOnce({ status: 404, message: 'Not Found' });

      await newBill.handleSubmit({
        preventDefault: jest.fn(),
        target: screen.getByTestId('form-new-bill'),
      });

      await expect(updateSpy.mock.results[0].value).rejects.toEqual({ status: 404, message: 'Not Found' });
    });

    it('should add a bill to API and fails with 500 message error', async () => {
      const onNavigateMock = jest.fn();
      const newBill = new NewBill({
        document: document,
        onNavigate: onNavigateMock,
        store: mockStore,
        localStorage: localStorageMock,
      });

      const updateSpy = jest.spyOn(mockStore.bills(), 'update').mockRejectedValueOnce({ status: 500, message: 'Internal Server Error' });

      await newBill.handleSubmit({
        preventDefault: jest.fn(),
        target: screen.getByTestId('form-new-bill'),
      });

      await expect(updateSpy.mock.results[0].value).rejects.toEqual({ status: 500, message: 'Internal Server Error' });
    });
  });
});