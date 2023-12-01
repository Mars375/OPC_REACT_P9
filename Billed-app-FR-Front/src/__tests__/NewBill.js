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

      // Assertions sur le rendu du formulaire
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

  describe("When I submit my form", () => {
    test("Then it should create a bill for a valid form", () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      newBill.handleSubmit = jest.fn();
      newBill.updateBill = jest.fn();
      newBill.onNavigate = jest.fn();

      const formValues = {
        type: 'Services en ligne',
        name: 'Abonnement Cloud',
        amount: '240',
        date: '2022-08-30',
        vat: '40',
        pct: '20',
        commentary: 'Test commentary',
      };

      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: formValues.type } });
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: formValues.name } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: formValues.date } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: formValues.amount.toString() } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: formValues.vat } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: formValues.pct.toString() } });
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: formValues.commentary } });

      fireEvent.submit(screen.getByTestId('form-new-bill'));

      expect(newBill.updateBill).toHaveBeenCalledWith({
        type: formValues.type,
        name: formValues.name,
        amount: parseInt(formValues.amount),
        date: formValues.date,
        vat: formValues.vat,
        pct: parseInt(formValues.pct) || 20,
        commentary: formValues.commentary,
        fileUrl: null,
        fileName: null,
        status: 'pending',
      });
      expect(newBill.onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });
  })
});