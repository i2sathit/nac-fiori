sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (UI5Object, BusyIndicator, Filter, FilterOperator, Constants, PostingUtil) {
	"use strict";

	return UI5Object.extend("giconfirmation.giconfirmation.model.DataManager", {
		constructor: function (oDataModel) {
			this._oDataModel = oDataModel;
			this._scannedMaterialData = {};
		},

		onRequestSent: function () {
			jQuery.sap.log.info("Sample: OData Request Sent");
		},

		onRequestCompleted: function () {
			jQuery.sap.log.info("Sample: OData Request Completed");
		},

		addScannedMaterialData: function (sBarcode, oMaterial) {
			this._scannedMaterialData[sBarcode] = oMaterial;
		},

		getScannedMaterialData: function (sBarcode) {
			return this._scannedMaterialData[sBarcode];
		}
	});

});