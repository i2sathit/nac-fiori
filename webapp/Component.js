sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"giconfirmation/giconfirmation/model/models",
	"giconfirmation/giconfirmation/model/DataManager"
], function (UIComponent, Device, models, DataManager) {
	"use strict";

	return UIComponent.extend("giconfirmation.giconfirmation.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
			this.oDataManager = new DataManager(this.getModel());
			
		},
		
		getDataManager : function(){
			return this.oDataManager;
		}
	});
});