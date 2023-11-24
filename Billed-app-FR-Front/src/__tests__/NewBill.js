/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import mockStore from '../__mocks__/store.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import NewBillUI from "../views/NewBillUI.js";
import { screen, fireEvent } from "@testing-library/dom";
import NewBill from "../containers/NewBill.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
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

    describe("When I am uploading an acceptable file", () => {
      test("Then it should return true for a valid file extension", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleChangeFileSpy = jest.spyOn(newBill, "handleChangeFile");
        let fileInput = screen.getByTestId("file");
        fireEvent.change(fileInput, {
          target: {
            files: [new File(["file contents"], "image.jpg", { type: "image/jpeg" })],
          },
        });

        const result = newBill.checkFileExtension(fileInput);

        setTimeout(() => {
          expect(handleChangeFileSpy).toHaveBeenCalled();

          handleChangeFileSpy.mockRestore();
        }, 0);

        expect(result).toBe(true);
      });
    });

    describe("When I am uploading a file with an invalid extension", () => {
      test("Then it should return false and show alert for invalid file extension", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

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
    });
  });
});