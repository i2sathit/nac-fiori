sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History"
], function (Controller, History) {
	"use strict";

	return Controller.extend("giconfirmation.giconfirmation.controller.Detail", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf giconfirmation.giconfirmation.view.Detail
		 */
		onInit: function () {
			this.oDataManager = this.getOwnerComponent().getDataManager();
			this.getRouter().getRoute("toProductDetail").attachPatternMatched(this.onProductDetailMatched, this);
			this.getRouter().getRoute("Master").attachPatternMatched(this.onMasterMatched, this);
			this._oModel = this.getOwnerComponent().getModel();
			this.getView().setModel(this._oModel);
			this._OriginalQuantity = 0;
			this._barcode_id = "";
			this._GiQty = 0;
		},

		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf giconfirmation.giconfirmation.view.Detail
		 */
		onBeforeRendering: function () {

		},

		onMasterMatched: function () {
			this.byId("pDetails").setVisible(false);
		},

		convertDouble: function (sDouble) {
			try {
			  return isNaN(parseFloat(sDouble)) ? -1 : parseFloat(sDouble);
			} catch (e) {
			  return -1;
			}
		  },

		onProductDetailMatched: function (oEvent) {
			this.byId("pDetails").setVisible(true);
			var barCodeId = decodeURIComponent(oEvent.getParameter("arguments").Barcode);
			var oGI_Qty = decodeURIComponent(oEvent.getParameter("arguments").GI_Qty);
			var oReturn = decodeURIComponent(oEvent.getParameter("arguments").Return);
			this._barcode_id = barCodeId;
			this._GiQty = this.convertDouble(oGI_Qty).toFixed(3);
			// this._oModel.read("/getBarcodeDetailsSet('" + encodeURI(barCodeId) + "')", {

			if(oReturn == 'X') {
				this.getView().byId("txt_Quantity").setEnabled(false);
			} else {
				this.getView().byId("txt_Quantity").setEnabled(true);
			}
			
			this._oModel.read("/getBarcodeDetailsSet(Barcode='" + encodeURI(barCodeId) + "',Mode='" + "" +
			"',DocumentNumber='" + "" + "',Type='" + "" + "')", {
				success: function (oRetrievedResult) {
					var barcode_txt = this.getView().byId("txt_Barcode");
					barcode_txt.setValue(oRetrievedResult.Barcode);

					var material_txt = this.getView().byId("txt_Material");
					material_txt.setValue(oRetrievedResult.Matnr);

					var po_txt = this.getView().byId("txt_PO");
					po_txt.setValue(oRetrievedResult.Ebeln);

					var size_txt = this.getView().byId("txt_Size");
					size_txt.setValue(oRetrievedResult.Size);

					var width_txt = this.getView().byId("txt_width");
					width_txt.setValue(oRetrievedResult.Width);

					var awidth_txt = this.getView().byId("txt_awidth");
					awidth_txt.setValue(oRetrievedResult.ActualWidth);

					var quantity_txt = this.getView().byId("txt_Quantity");
					quantity_txt.setValue(this._GiQty);
					this._OriginalQuantity = oRetrievedResult.Tktqty;

					var unit_txt = this.getView().byId("txt_Unit");
					unit_txt.setValue(oRetrievedResult.Unit);

					var status_txt = this.getView().byId("txt_status");
					status_txt.setValue(oRetrievedResult.Status);

					var fapprove_txt = this.getView().byId("txt_fapprove");
					fapprove_txt.setValue(oRetrievedResult.FinalAppoval);

					var vbatch_txt = this.getView().byId("txt_VBatch");
					vbatch_txt.setValue(oRetrievedResult.VendorBatch);

				}.bind(this),
				error: function (oError) {}
			});
		},

		handleLiveChange: function (oEvent) {
			if ((sap.ui.getCore().byId("rbtType2").getSelected()) == false) {
				var txtQty = this.convertDouble(this.getView().byId("txt_Quantity").getValue());
				var OriQty = this.convertDouble(this._OriginalQuantity);
				var oGI_Qty = this._GiQty;
				if (txtQty > OriQty && OriQty != -1 && OriQty != -1) {
					this.getView().byId("txt_Quantity").setValueState("Error");
					this.getView().byId("btn_savem").setEnabled(false);
					oEvent.getSource().setValue(oGI_Qty);
				} else {
					this.getView().byId("txt_Quantity").setValueState("None");
					this.getView().byId("btn_savem").setEnabled(true);
					var changeQty = this.convertDouble(oEvent.getSource().getValue()).toFixed(3);
					oEvent.getSource().setValue(changeQty);
				}
			}
		},

		convertDouble: function (sDouble) {
			try {
			  return isNaN(parseFloat(sDouble)) ? -1 : parseFloat(sDouble);
			} catch (e) {
			  return -1;
			}
		  },

		updateManualQty: function (oEvent) {
			var manualValue = this.getView().byId("txt_Quantity").getValue();
			var oBarcode = this._barcode_id;
			var oData = {
				Qty: manualValue,
				BarCode: this._barcode_id
			};
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("_onSaveQtyBtnPress", "dsdsd", oData);
		},

		onNavBack: function (oEvent) {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				var oRouter = this.getRouter();
				oRouter.navTo("Master", false);
			}
			// var oSplitApp = this.getView().getParent().getParent();
			// var oMaster = oSplitApp.getMasterPages()[0];
			// oSplitApp.toMaster(oMaster, "flip");
		}

	});

});