sap.ui.define([
	"sap/ui/core/format/NumberFormat"
], function (NumberFormat) {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		quantityValue : function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		formatFixed2 : function (sValue) {
			var oFormatOptions = {
				minFractionDigits: 2,
				maxFractionDigits: 2
			};

			var oFloatFormat = NumberFormat.getFloatInstance(oFormatOptions);
			return oFloatFormat.format(sValue);
		}
	};
});