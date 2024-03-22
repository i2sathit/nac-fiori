sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/ValueState",
  "sap/ui/model/Filter",
  "sap/ui/model/json/JSONModel",
  "../model/formatter",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment"
], function (Controller, ValueState, Filter, JSONModel, formatter, MessageBox, Fragment) {
  "use strict";

  return Controller.extend("giconfirmation.giconfirmation.controller.Master", {
    metadata: {
      manifest: "json"
    },

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created.
     * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
     * @memberOf giconfirmation.giconfirmation.view.Master
     */
    formatter: formatter,
    onInit: function () {
      debugger
      this.oDataManager = this.getOwnerComponent().getDataManager();
      this._oModel = this.getOwnerComponent().getModel();
      this.getView().setModel(this._oModel);
      this._scannedMatData = [];
      this._pickListData = [];
      this._pickListPopUpData = [];
      this.lastSelectedBarcode = "";

      if (this.dialog) { this.dialog.destroy(true); }
      this.dialog = sap.ui.xmlfragment("giconfirmation.giconfirmation.view.initSelection", this);
      this.getView().addDependent(this.dialog);

      if (this.dialogSel2) { this.dialogSel2.destroy(true); }
      this.dialogSel2 = sap.ui.xmlfragment("giconfirmation.giconfirmation.view.initSelection2", this);
      this.getView().addDependent(this.dialogSel2);

      if (this.subsitute_dialog) { this.subsitute_dialog.destroy(true); }
      this.subsitute_dialog = sap.ui.xmlfragment("giconfirmation.giconfirmation.view.substituleListPopUp", this);
      this.getView().addDependent(this.subsitute_dialog);

      // this.postButton = sap.ui.getCore().byId("btn_Confirm");

      sap.ui.getCore().byId("PlantInput").setValueState("Error");
      sap.ui.getCore().byId("sLocInput").setValueState("Error");
      sap.ui.getCore().byId("btn_Confirm").setEnabled(false);
      // sap.ui.getCore().byId("btn_submit").setEnabled(false);

      //  this._oDialog = sap.ui.xmlfragment("sap.ui.demo.wt.view.HelloDialog");
      // this.getView().addDependent(this.dialog);
      // this.dialog.open();

      this._plant = "";
      this._sLocation = "";
      this._mode = "";
      this._type = "";

      this.oModelScanned = new sap.ui.model.json.JSONModel();
      this.oModelScanned.setData(this._scannedMatData); // Only set data here.
      this.getView().setModel(this.oModelScanned, "data"); // set the alias here

      var lst_mats = this.getView().byId("barcodeList");
      lst_mats.setModel(this.oModelScanned);

      //Substitute Pop-up
      this.oModelSubstitute = new sap.ui.model.json.JSONModel();

      //This code is for manual Qty update related data read
      var oEventBus = sap.ui.getCore().getEventBus();
      oEventBus.subscribe("_onSaveQtyBtnPress", "dsdsd", this._onSaveQtyBtnPress, this);

    },

    onBeforeRendering: function () {
      this.dialog.open();
    },

    onSaveQtyBtnPress: function (oEvent) {
      //update array in list
      var oData = {
        Qty: 0
      };
      var oEventBus = sap.ui.getCore().getEventBus();
      oEventBus.publish("_onButtonPress", oEvent, oData);
    },

    _onSaveQtyBtnPress: function (oEvent, oData, barcodeManualData) {
      var oType = sap.ui.getCore().byId("keyDoc").getValue().substring(0, 1);
      var i;
      for (i = 0; i < this._scannedMatData.length; i++) {
        if (this._scannedMatData[i].Barcode == barcodeManualData.BarCode) {
          this._scannedMatData[i].Tktqty = barcodeManualData.Qty;
          this._scannedMatData[i].GiQty = this.convertDouble(barcodeManualData.Qty);
        }
      }

      if (oType == "2") {
        this.updateVenderQty();
      }
      this.updateRemainQty();

      var lst_mats = this.getView().byId("barcodeList");
      lst_mats.getModel("data").refresh();

      sap.m.MessageToast.show("Quantity has been updated successfully.", {});

      this.getOwnerComponent().getRouter().navTo("Master", {}, false); // Clear Screen Detail
    },

    handleSuggest: function (oEvent) {
      var sTerm = oEvent.getParameter("suggestValue");
      var aFilters = [];
      if (sTerm) {
        aFilters.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.Contains, sTerm));
      }
      oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
      oEvent.getSource().getBinding("suggestionItems").resume();
    },

    handleSuggestLgort: function (oEvent) {
      var sTerm = oEvent.getParameter("suggestValue");
      var aFilters = [];
      if (sTerm) {
        aFilters.push(new sap.ui.model.Filter("Lgort", sap.ui.model.FilterOperator.Contains, sTerm));
      }
      oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
      oEvent.getSource().getBinding("suggestionItems").resume();
    },

    handleSuggestMvmt: function (oEvent) {
      var sTerm = oEvent.getParameter("suggestValue");
      var aFilters = [];
      if (sTerm) {
        aFilters.push(new sap.ui.model.Filter("Bwart", sap.ui.model.FilterOperator.Contains, sTerm));
      }
      oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
      oEvent.getSource().getBinding("suggestionItems").resume();
    },

    ArticleStatus: function (sStatus) {
      if (sStatus == "ERROR") {
        return ValueState.Error;
      } else if (sStatus == "COMPLETED") {
        return ValueState.Success;
      } else if (sStatus == "SCANNED") {
        return ValueState.Warning;
      }
    },

    onConfirm: function (oEvent) {
      this._plant = sap.ui.getCore().byId("PlantInput").getValue();
      this._sLocation = sap.ui.getCore().byId("sLocInput").getValue();
      this._postDate = sap.ui.getCore().byId("DateInput").getDateValue();

      // Type
      if ((sap.ui.getCore().byId("rbtType1").getSelected()) == true) {
        this._type = "GI";
      } else if ((sap.ui.getCore().byId("rbtType2").getSelected()) == true) {
        this._type = "GR";
      }

      // Mode
      if ((sap.ui.getCore().byId("rbtMode1").getSelected()) == true) {
        this._mode = "PL";
      } else if ((sap.ui.getCore().byId("rbtMode2").getSelected()) == true) {
        this._mode = "ST";
      } else if ((sap.ui.getCore().byId("rbtMode3").getSelected()) == true) {
        this._mode = "ST2";
      } else if ((sap.ui.getCore().byId("rbtMode4").getSelected()) == true) {
        this._mode = "OT";
      }
      this.dialog.close();
      this.getView().addDependent(this.dialogSel2);

      // Build Dynamic Text For Selection
      if ((this._type == "GI" || this._type == "GR") && this._mode == "PL") {
        sap.ui.getCore().byId("keyDoc").setPlaceholder("Pick List");
        sap.ui.getCore().byId("keyDoc").setValueState("Error");
        sap.ui.getCore().byId("btn_Done").setEnabled(false);
      } else if ((this._type == "GI" || this._type == "GR") && this._mode == "OT") {
        sap.ui.getCore().byId("keyDoc").setPlaceholder("");
      } else if ((this._type == "GI") && (this._mode == "ST" || this._mode == "ST2")) {
        sap.ui.getCore().byId("keyDoc").setPlaceholder("Delivery Number");
      } else if ((this._type == "GR") && this._mode == "ST2") {
        sap.ui.getCore().byId("keyDoc").setPlaceholder("Delivery Number");
      }

      //Bind Movement Type
      var _mvmtFilter = [];
      var nameFilterType = new sap.ui.model.Filter("Mode", sap.ui.model.FilterOperator.EQ, this._mode);
      var nameFilterMode = new sap.ui.model.Filter("Type", sap.ui.model.FilterOperator.EQ, this._type);
      _mvmtFilter.push(nameFilterType);
      _mvmtFilter.push(nameFilterMode);
      var movementTypesModel = [];
      this._oModel.read("/getMovementTypesSet", {
        filters: _mvmtFilter,
        success: function (oRetrievedResult) {
          movementTypesModel = new sap.ui.model.json.JSONModel(oRetrievedResult.results);
          sap.ui.getCore().byId("mvmtType").setModel(movementTypesModel);

          var t_641 = "";
          for (var i = 0; i < oRetrievedResult.results.length; i++) {
            if (oRetrievedResult.results[i].Bwart == '641') {
              t_641 = "641 (STO) / 601 (DEL)";
            }
            if (oRetrievedResult.results[i].Bwart == '642') {
              t_641 = "642 (STO) / 602 (DEL)";
            }
          }

          if (t_641 != "") {
            sap.ui.getCore().byId("mvmtType").bindItems({
              path: "/",
              template: new sap.ui.core.Item({
                key: "{Bwart}",
                text: t_641
              })
            });
          } else {
            sap.ui.getCore().byId("mvmtType").bindItems({
              path: "/",
              template: new sap.ui.core.Item({
                key: "{Bwart}",
                text: "{Bwart}"
              })
            });
          }

          var selectedBwart = oRetrievedResult.results[0].Bwart;
          sap.ui.getCore().byId("mvmtType").setSelectedKey(selectedBwart);

          //populate movement reason data
          // var _mvmtFilterReason = [];
          // var movementReasonModel = [];
          // var nameFilterReason = new sap.ui.model.Filter("MovementType", sap.ui.model.FilterOperator.EQ, selectedBwart);
          // _mvmtFilterReason.push(nameFilterReason);
          // this._oModel.read("/getMovementReasonsSet", {
          //   filters: _mvmtFilterReason,
          //   success: function (oRetrievedResultReason) {

          //     movementReasonModel = new sap.ui.model.json.JSONModel(oRetrievedResultReason.results);
          //     sap.ui.getCore().byId("mvmtReason").setModel(movementReasonModel);

          //     sap.ui.getCore().byId("mvmtReason").bindItems({
          //       path: "/",
          //       template: new sap.ui.core.Item({
          //         key: "{MovementReason}",
          //         text: "{MovementReasonDesc}"
          //       })
          //     });

          //     if (oRetrievedResultReason.results.length != 0) {
          //       var selectedMovementReason = oRetrievedResultReason.results[0].MovementReason;
          //       sap.ui.getCore().byId("mvmtReason").setSelectedKey(selectedMovementReason);
          //     }

          //   }.bind(this),
          //   error: function (oError) {
          //     sap.m.MessageToast.show("An error occured while retrieving movement reason data.", {});
          //   }
          // });
          //end of movement reason data population

        }.bind(this),
        error: function (oError) {
          sap.m.MessageToast.show("An error occured while retrieving movement type data.", {});
        }
      });
      // Bind Movement Type----------- end

      this.dialogSel2.open();
    },

    onDone: function (oEvent) {

      var odataBarcodeArr = [];
      var rbt_Mode = sap.ui.getCore().byId("RG_Mode");
      var selected_mode = rbt_Mode.getSelectedIndex();
      var rbt_Type = sap.ui.getCore().byId("RG_Type");
      var selected_type = rbt_Type.getSelectedIndex();

      var mode_needs_picklist;
      switch (selected_mode) { //Mode
        case 0:
          if (this._type != "GR") {
            mode_needs_picklist = "X";
          }

          break;
        default:
          mode_needs_picklist = "";
      }
      // selected_mode = 0 (Packing List), 1 (Delivery), 2 (Other)
      // selected_type = 0 (Goods Issue), 1 (Goods Return) 
      if (selected_mode == 0 && selected_type == 0) { // Packing List and Goods Issue
        var _mvmtFilter = [];
        var mvmtType = sap.ui.getCore().byId("mvmtType").getSelectedKey();
        var picklistinput = sap.ui.getCore().byId("keyDoc").getValue();
        var Sloc = sap.ui.getCore().byId("sLocInput").getValue();
        var oPlant = sap.ui.getCore().byId("PlantInput").getValue();
        var MatDoc = this.convertMatDoc(sap.ui.getCore().byId("matSlip").getValue());
        var nameFilterPickListIn = new sap.ui.model.Filter("Picklistno", sap.ui.model.FilterOperator.EQ, picklistinput);
        // var nameFilterMatDoc = new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, MatDoc);
        var nameFilterSloc = new sap.ui.model.Filter("lgort", sap.ui.model.FilterOperator.EQ, Sloc);
        var nameFilterPlant = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, oPlant);
        _mvmtFilter.push(nameFilterPickListIn);
        // _mvmtFilter.push(nameFilterMatDoc);
        _mvmtFilter.push(nameFilterSloc);
        _mvmtFilter.push(nameFilterPlant);

        if (MatDoc != '') {
          var nameFilterMatDoc = new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, MatDoc);
          _mvmtFilter.push(nameFilterMatDoc);
        }

        if (mvmtType == "262") {
          var nameFilterReason = new sap.ui.model.Filter("Reson", sap.ui.model.FilterOperator.EQ, "X");
          _mvmtFilter.push(nameFilterReason);
        }

        this._oModel.read("/getVendorBatchQtySet", {
          filters: _mvmtFilter,
          success: function (oData, sStatus, oResponse) {
            if (oData.length != 0) {
              this._oModelList = oData.results;
              this._oVenQtyList = [];
              this._oPoQtyList = [];

              if (this._oModelList.length > 0) {
                if (this._oModelList[0].Message != '') {
                  MessageBox.error(this._oModelList[0].Message);
                  return;
                }
              } else {
                MessageBox.error("An error occured while retrieving picklist data.");
                return;
              }


              for (let i = 0; i < this._oModelList.length; i++) {
                this._oModelList[i].Poqty = this.convertDouble(this._oModelList[i].Poqty);
                this._oModelList[i].Venqty = this.convertDouble(this._oModelList[i].Venqty);
                var cMatDoc = this._oModelList.filter(m => m.Matnr == this._oModelList[i].Matnr && m.Charg == this._oModelList[i].Charg);
                var iListPoQty = {}, iListVenQty = {};
                iListVenQty = { "Picklistno": cMatDoc[0].Picklistno, "Matnr": cMatDoc[0].Matnr, "Charg": cMatDoc[0].Charg, "Venqty": this._oModelList[i].Venqty, "VendorBatch": this._oModelList[i].Vendbatch, "Size": cMatDoc[0].size1 };
                this._oVenQtyList.push(iListVenQty);
                if (this._oPoQtyList.length == 0 && cMatDoc.length > 0) {
                  // Sum Po Qty from filter
                  var oPoQty = cMatDoc.reduce((accumulator, object) => {
                    return accumulator + this.convertDouble(object.Poqty);
                  }, 0);
                  iListPoQty = { "Picklistno": cMatDoc[0].Picklistno, "Matnr": cMatDoc[0].Matnr, "Charg": cMatDoc[0].Charg, "Poqty": oPoQty, "Size": cMatDoc[0].size1 };
                  this._oPoQtyList.push(iListPoQty);
                } else {
                  var cListPo = this._oPoQtyList.filter(m => m.Matnr == this._oModelList[i].Matnr && m.Charg == this._oModelList[i].Charg);

                  if (cListPo.length == 0 && cMatDoc.length > 0) {
                    // Sum Po Qty from filter
                    var oPoQty = cMatDoc.reduce((accumulator, object) => {
                      return accumulator + this.convertDouble(object.Poqty);
                    }, 0);
                    iListPoQty = { "Picklistno": cMatDoc[0].Picklistno, "Matnr": cMatDoc[0].Matnr, "Charg": cMatDoc[0].Charg, "Poqty": oPoQty };
                    this._oPoQtyList.push(iListPoQty);
                  }
                }
              }

              if (this._oModelList !== undefined) {
                this.getView().byId("boxMvmtReason").setVisible(false);
                this.getView().byId("inpMvmtReason").setValue('');
                this.dialogSel2.close();
              }

            } else {
              MessageBox.error("An error occured while retrieving picklist data.");
            }
          }.bind(this),
          error: function (oError, sStatus, oResponse) {
            MessageBox.error("An error occured while retrieving picklist data.");
          }
        });
      } else if (selected_mode == 0 && selected_type == 1) { // Packing List and Goods Return
        var _mvmtFilter = [];
        var mvmtType = sap.ui.getCore().byId("mvmtType").getSelectedKey();
        var picklistinput = sap.ui.getCore().byId("keyDoc").getValue();
        var Sloc = sap.ui.getCore().byId("sLocInput").getValue();
        var oPlant = sap.ui.getCore().byId("PlantInput").getValue();
        var MatDoc = this.convertMatDoc(sap.ui.getCore().byId("matSlip").getValue());
        var nameFilterPickListIn = new sap.ui.model.Filter("Picklistno", sap.ui.model.FilterOperator.EQ, picklistinput);
        // var nameFilterMatDoc = new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, MatDoc);
        var nameFilterSloc = new sap.ui.model.Filter("lgort", sap.ui.model.FilterOperator.EQ, Sloc);
        var nameFilterPlant = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, oPlant);
        _mvmtFilter.push(nameFilterPickListIn);
        // _mvmtFilter.push(nameFilterMatDoc);
        _mvmtFilter.push(nameFilterSloc);
        _mvmtFilter.push(nameFilterPlant);

        if (MatDoc != '') {
          var nameFilterMatDoc = new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, MatDoc);
          _mvmtFilter.push(nameFilterMatDoc);
        }

        if (mvmtType == "262") {
          var nameFilterReason = new sap.ui.model.Filter("Reason", sap.ui.model.FilterOperator.EQ, "X");
          _mvmtFilter.push(nameFilterReason);
        }

        this._oModel.read("/getVendorBatchQtySet", {
          filters: _mvmtFilter,
          success: function (oData, sStatus, oResponse) {
            if (oData.length != 0) {
              this._oModelList = oData.results;
              this._oReturnList = [];

              if (this._oModelList.length > 0) {
                if (this._oModelList[0].Message != '') {
                  MessageBox.error(this._oModelList[0].Message);
                  return;
                }
              } else {
                MessageBox.error("An error occured while retrieving picklist data.");
                return;
              }

              for (let i = 0; i < this._oModelList.length; i++) {
                this._oModelList[i].Poqty = this.convertDouble(this._oModelList[i].Poqty);
                this._oModelList[i].Venqty = this.convertDouble(this._oModelList[i].Venqty);
                var iListReturnQty = {
                  "Barcode": this._oModelList[i].Barcodeid, "Charg": this._oModelList[i].Charg, "Matnr": this._oModelList[i].Matnr,
                  "Picklistno": this._oModelList[i].Picklistno, "Plant": this._oModelList[i].Plant, "lgort": this._oModelList[i].lgort,
                  "Vendbatch": this._oModelList[i].Vendbatch, "Reason": this._oModelList[i].Reason, "Venqty": this._oModelList[i].Venqty,
                  "Size": this._oModelList[i].size1, "Unit": this._oModelList[i].Unit
                };

                this._oReturnList.push(iListReturnQty);
              }

              if (this._oModelList !== undefined) {
                this.getView().byId("boxMvmtReason").setVisible(true);
                this.getView().byId("inpMvmtReason").setValue(this._oReturnList[0].Reason);
                this.dialogSel2.close();
              }
            } else {
              MessageBox.error("An error occured while retrieving picklist data.");
            }
          }.bind(this),
          error: function (oError, sStatus, oResponse) {
            MessageBox.error("An error occured while retrieving picklist data.");
          }
        });
      } else if (selected_mode == 2 && selected_type == 0) { // Other Movements and Good Issue
        var _mvmtFilter = [];
        var picklistinput = sap.ui.getCore().byId("keyDoc").getValue();
        var nameFilterPickListIn = new sap.ui.model.Filter("Picklistno", sap.ui.model.FilterOperator.EQ, picklistinput);
        _mvmtFilter.push(nameFilterPickListIn);

        this._oModel.read("/getPickListDataOnClickSet", {
          filters: _mvmtFilter,
          success: function (oRetrievedResult) {

            this._pickListData = oRetrievedResult.results;

            var promiseArr = [];

            for (var j = 0; j < this._pickListData.length; j++) {

              var rbtType = sap.ui.getCore().byId("RG_Type");
              var sType = rbtType.getSelectedIndex();
              var rbtMode = sap.ui.getCore().byId("RG_Mode");
              var sMode = rbtMode.getSelectedIndex();
              var picklistNumber = sap.ui.getCore().byId("keyDoc").getValue();

              var promiseBarcode = new Promise(function (resolve, reject) {
                //  if (this._pickListData[j].Bin === "CUTTING" || this._pickListData[j].Bin === "SEWING") {
                this._oModel.read("/getBarcodeDetailsSet(Barcode='" + encodeURI(this._pickListData[j].BarcodeId) + "',Mode='" + sMode +
                  "',DocumentNumber='" + picklistNumber + "',Type='" + sType + "')", {
                  async: false,
                  success: function (oRetrievedResultS) {
                    resolve(oRetrievedResultS);
                  }
                }
                );
                //  }

              }.bind(this));
              promiseArr.push(promiseBarcode);
            }

            Promise.all(promiseArr).then(function (oresponse) {

              for (var q = 0; q < oresponse.length; q++) {

                const arrayFind = this._scannedMatData.find(({
                  Barcode
                }) => Barcode === oresponse[q].Barcode);
                if (arrayFind == undefined) {
                  this._scannedMatData.push(oresponse[q]);
                }
              }

              var lst_mats = this.getView().byId("barcodeList");
              lst_mats.getModel("data").refresh();

              sap.m.MessageToast.show("Pick list data have been retrieved successfully.", {});
            }.bind(this));

          }.bind(this),
          error: function (oError) {
            sap.m.MessageToast.show("An error occured while retrieving picklist data.", {});
          }
        });
        this.dialogSel2.close();
      }
      // this.dialogSel2.close();
    },

    convertDouble: function (sDouble) {
      try {
        return isNaN(parseFloat(sDouble)) ? -1 : parseFloat(sDouble);
      } catch (e) {
        return -1;
      }
    },

    convertInt: function (sInt) {
      try {
        return isNaN(parseInt(sDouble)) ? -1 : parseInt(sDouble);
      } catch (e) {
        return -1;
      }
    },

    convertMatDoc: function (sMatDoc) {
      var oMatDoc = sMatDoc;
      if (oMatDoc.length != 0) {
        for (let i = oMatDoc.length; i < 18; i++) {
          oMatDoc = '0' + oMatDoc;
        }
      } else {
        oMatDoc = '';
      }
      return oMatDoc;
    },

    _getDialog: function () {
      // create a fragment with dialog, and pass the selected data
      if (!this.dialog) {
        // This fragment can be instantiated from a controller as follows:
        this.dialog = sap.ui.xmlfragment("view.initSelection", this);
      }
      return this.dialog;
    },

    onListItemPress: function (oEvent) {

      var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
      var oMvmtType = sap.ui.getCore().byId("mvmtType").getSelectedKey();
      var oReturn;
      //get object()
      var ListItemPressed = oEvent.getSource().getBindingContext().getObject();
      oStorage.put("scannedMatData", ListItemPressed);
      var oGiQty = this.convertDouble(ListItemPressed.GiQty.toFixed(3))

      if (oMvmtType == '262') {
        oReturn = 'X';
      } else {
        oReturn = 'E';
      }

      this.getRouter().navTo("toProductDetail", {
        Barcode: encodeURIComponent(ListItemPressed.Barcode),
        GI_Qty: encodeURIComponent(oGiQty),
        Return: encodeURIComponent(oReturn)
      }, false);
    },

    getRouter: function () {
      return this.getOwnerComponent().getRouter();
    },

    onAddMaterialToPost: function (oEvent) {
      this.scannedItem.close();
    },

    onRemoveMaterialToPost: function (oEvent) {
      this.scannedItem.close();
    },

    clearGIData: function (oEvent) {

      this.getView().byId("btn_submit").setEnabled(true);
      sap.ui.getCore().byId("PlantInput").setValue('');
      sap.ui.getCore().byId("PlantInput").setValueState('Error');
      sap.ui.getCore().byId("sLocInput").setValue('');
      sap.ui.getCore().byId("sLocInput").setValueState('Error');
      sap.ui.getCore().byId("DateInput").setValue('');
      sap.ui.getCore().byId("DateInput").setValueState('Error');
      sap.ui.getCore().byId("keyDoc").setValue('');
      sap.ui.getCore().byId("keyDoc").setValueState('Error');
      sap.ui.getCore().byId("matSlip").setValue('');

      this.getOwnerComponent().getRouter().navTo("Master", {}, false); // Clear Screen Detail

      //clear scanned list
      this._scannedMatData = [];
      this.oModelScanned.setData(this._scannedMatData);
      var _lst_mats = this.getView().byId("barcodeList");
      _lst_mats.getModel("data").refresh();

      this.dialog.open();
    },

    onMovementTypeChange: function (oEvent) {
      //populate movement reason data
      var _mvmtFilterReason = [];
      var movementReasonModel = [];
      var nameFilterReason = new sap.ui.model.Filter("MovementType", sap.ui.model.FilterOperator.EQ, sap.ui.getCore().byId("mvmtType").getSelectedKey());
      _mvmtFilterReason.push(nameFilterReason);
      this._oModel.read("/getMovementReasonsSet", {
        filters: _mvmtFilterReason,
        success: function (oRetrievedResultReason) {

          movementReasonModel = new sap.ui.model.json.JSONModel(oRetrievedResultReason.results);
          sap.ui.getCore().byId("mvmtReason").setModel(movementReasonModel);

          sap.ui.getCore().byId("mvmtReason").bindItems({
            path: "/",
            template: new sap.ui.core.Item({
              key: "{MovementReason}",
              text: "{MovementReasonDesc}"
            })
          });

          if (oRetrievedResultReason.results.length != 0) {
            var selectedMovementReason = oRetrievedResultReason.results[0].MovementReason;
            sap.ui.getCore().byId("mvmtReason").setSelectedKey(selectedMovementReason);
          }

        }.bind(this),
        error: function (oError) {
          sap.m.MessageToast.show("An error occured while retrieving movement reason data.", {});
        }
      });
      //end of movement reason data population
    },

    onSelectionChange: function (oEvent) {
      var oSelectedItem = oEvent.getParameters("listItem");
      var oSelectedItemDetail = oSelectedItem.listItem.getBindingContext().getObject();
      var error_flag = "";

      this._oModel.read("/getBarcodeDetailsSet('" + encodeURI(oSelectedItemDetail.BarcodeId) + "')", {
        success: function (oRetrievedResult) {
          if (oRetrievedResult.MessageType != "E") {

            for (var i = 0; i < this._scannedMatData.length; i++) {
              if (oRetrievedResult.Barcode == this._scannedMatData[i].Barcode) {
                error_flag = "X";
                oRetrievedResult.Message = "Barcode has already been added into the queue.";
              }
            }

            if (error_flag != "X") {
              oRetrievedResult.OriginalBarcode = oRetrievedResult.Barcode;
              oRetrievedResult.Barcode = this.lastSelectedBarcode;

              // Replace quantity
              oRetrievedResult.Tktqty = oSelectedItemDetail.Bdmng;

              this._scannedMatData.push(oRetrievedResult);
              this.oDataManager.addScannedMaterialData(oRetrievedResult.Barcode, oRetrievedResult);
              var lst_mats = this.getView().byId("barcodeList");
              lst_mats.getModel().refresh();
            } else {
              sap.m.MessageToast.show(oRetrievedResult.Message, {});
            }

          } else {
            sap.m.MessageToast.show(oRetrievedResult.Message, {});
          }

        }.bind(this),
        error: function (oError) {
          sap.m.MessageToast.show("An error occured while retrieving substitute barcode data.", {});
        }
      });
      this.subsitute_dialog.close();
    },

    handleBarcodeScannerSuccess: function (oEvent) {

      // sap.ui.core.BusyIndicator.show(0);
      // keep last selected barcode for substitution
      // this.lastSelectedBarcode = oEvent.getParameter("text");
      this.lastSelectedBarcode = oEvent.getParameters("text").newValue;

      // sap.ui.core.BusyIndicator.show(0);

      // this._oModel.read("/getBarcodeDetailsSet('" + encodeURI(oEvent.getParameter("text")) + "')", {
      // this._oModel.read("/getBarcodeDetailsSet('" + encodeURI(oEvent.getParameters("text").newValue) + "')", {

      // selected_mode = 0 (Packing List), 1 (Delivery), 2 (Other)
      // selected_type = 0 (Goods Issue), 1 (Goods Return) 
      var rbtType = sap.ui.getCore().byId("RG_Type");
      var sType = rbtType.getSelectedIndex();
      var rbtMode = sap.ui.getCore().byId("RG_Mode");
      var sMode = rbtMode.getSelectedIndex();
      var picklistNumber = sap.ui.getCore().byId("keyDoc").getValue();

      this._oModel.read("/getBarcodeDetailsSet(Barcode='" + encodeURIComponent(oEvent.getParameters("text").newValue) + "',Mode='" + sMode +
        "',DocumentNumber='" + picklistNumber + "',Type='" + sType + "')", {
        success: function (oRetrievedResult) {
          var keyDocID = sap.ui.getCore().byId("keyDoc").getValue();
          var error_flag = "";
          var error_message = "";
          var is_substitutable = "";
          var cMatDoc, cPoList, cReturnList;
          var oItems = this.getView().byId("barcodeList").getItems();
          var oMvmtType = sap.ui.getCore().byId("mvmtType").getSelectedKey();

          // Check Duplitcate Barcode
          if (oItems.length > 0) {
            for (let i = 0; i < oItems.length; i++) {
              var oItem = oItems[i].getBindingContext().getObject();
              if (oItem.Barcode == oRetrievedResult.Barcode) {
                MessageBox.error("Duplitcate Barcode");
                return;
              }
            }
          }

          if (sMode == 0 && sType == 0) { // Packing List and Goods Issue
            cPoList = this._oPoQtyList.filter(i => i.Matnr == oRetrievedResult.Matnr && i.Charg == oRetrievedResult.Batch);

            // Check Type '1' or '2'
            if (keyDocID.substring(0, 1) == '1') {
              cMatDoc = this._oPoQtyList.filter(i => i.Matnr == oRetrievedResult.Matnr && i.Charg == oRetrievedResult.Batch);
            } else if (keyDocID.substring(0, 1) == '2') {
              cMatDoc = this._oVenQtyList.filter(i => i.Matnr == oRetrievedResult.Matnr && i.Charg == oRetrievedResult.Batch && i.VendorBatch == oRetrievedResult.VendorBatch);
            }

            if (cPoList.length == 0) {
              MessageBox.error("Unable to find value for this barcode.");
              return;
            }

            // init Value
            var oTktQty = this.convertDouble(oRetrievedResult.Tktqty);
            var oGiQty = oTktQty;
            var oRemainQty = oTktQty - oGiQty;
            var oRemainVenBatch;
            var oRemainPoBatch = cPoList[0].Poqty;
            var oPoQty = oRemainPoBatch - oGiQty;

            if (cMatDoc.length > 0) {
              if (keyDocID.substring(0, 1) == '1') {
                oRemainVenBatch = 0
                if (oRemainPoBatch < oTktQty) {
                  oGiQty = oRemainPoBatch;
                  oRemainQty = oTktQty - oGiQty;
                  oPoQty = oRemainPoBatch - oGiQty;
                }
              } else if (keyDocID.substring(0, 1) == '2') {
                var oVenQty = cMatDoc[0].Venqty;
                if (oVenQty > oRemainPoBatch) {
                  oVenQty = oRemainPoBatch;
                }
                oRemainVenBatch = oVenQty;
                if (oRemainVenBatch < oTktQty && oRemainVenBatch <= oRemainPoBatch && oVenQty >= 0) {
                  oGiQty = oRemainVenBatch;
                  oRemainVenBatch = cMatDoc[0].Venqty - oGiQty;
                  oRemainQty = oTktQty - oGiQty;
                  oPoQty = oRemainPoBatch - oGiQty;
                } else {
                  oRemainVenBatch = oVenQty - oGiQty;
                }
              }

              if (oRemainPoBatch != 0) {
                oRetrievedResult.TktQty = oTktQty;
                oRetrievedResult.GiQty = oGiQty;
                oRetrievedResult.RemainQty = oRemainQty;
                oRetrievedResult.PoQty = oPoQty;
                oRetrievedResult.VenQty = oRemainVenBatch;

                cPoList[0].Poqty = oPoQty;
                cMatDoc[0].Venqty = oRemainVenBatch;
              } else {
                MessageBox.error("This barcode exceeds Po Qty and cannot be scanned.");
                return;
              }
            } else {
              if (keyDocID.substring(0, 1) == '2') {
                this._BarcodeTemp = oRetrievedResult;

                if (this._ReasonDialog) {
                  this._ReasonDialog.destroy(true);
                }

                this._ReasonDialog = sap.ui.xmlfragment("rDialog", "giconfirmation.giconfirmation.view.reasonDialog", this);
                this.getView().addDependent(this._ReasonDialog);

                var selectedBwart = sap.ui.getCore().byId("mvmtType").getSelectedKey();
                var _mvmtFilterReason = [];
                var movementReasonModel = [];
                var nameFilterReason = new sap.ui.model.Filter("MovementType", sap.ui.model.FilterOperator.EQ, selectedBwart);
                _mvmtFilterReason.push(nameFilterReason);

                this._oModel.read("/getMovementReasonsSet", {
                  filters: _mvmtFilterReason,
                  success: function (oRetrievedResultReason) {

                    movementReasonModel = new sap.ui.model.json.JSONModel(oRetrievedResultReason.results);
                    sap.ui.core.Fragment.byId("rDialog", "mReasonList").setModel(movementReasonModel);

                    sap.ui.core.Fragment.byId("rDialog", "mReasonList").bindItems({
                      path: "/",
                      template: new sap.ui.core.Item({
                        key: "{MovementReason}",
                        text: "{MovementReasonDesc}"
                      })
                    });

                    this._ReasonDialog.open();
                  }.bind(this),
                  error: function (oError) {
                    sap.m.MessageToast.show("An error occured while retrieving movement reason data.", {});
                  }
                });

                return;
              } else {
                MessageBox.error("Unable to find value for this barcode.");
                return;
              }
            }
          } else if (sMode == 0 && sType == 1) { // Packing List and Goods Return
            cReturnList = this._oReturnList.filter(o => o.Barcode == oRetrievedResult.Barcode);

            if (cReturnList.length > 0) {
              let oReTktQty = this.convertDouble(oRetrievedResult.TktQty);
              let oReGiQty = cReturnList[0].Venqty;
              let oReRemainQty = oReTktQty - oReGiQty;
              oRetrievedResult.TktQty = oReTktQty;
              oRetrievedResult.GiQty = oReGiQty;
              oRetrievedResult.RemainQty = oReRemainQty;
              oRetrievedResult.Return = 'X';
              cReturnList[0].Return = 'X';
            } else {
              MessageBox.error("Unable to find value for this barcode.");
              return;
            }
          }

          // Validations --- start
          var rbt_Type = sap.ui.getCore().byId("RG_Type");
          var selected_type = rbt_Type.getSelectedIndex();
          var rbt_Mode = sap.ui.getCore().byId("RG_Mode");
          var selected_mode = rbt_Mode.getSelectedIndex();

          //---------------------- Plant validation
          // for goods return on STO scenarios do not conduct the plant validation
          // Type 1 - GR | Mode 1 - ST Mode 2 - ST2
          if (selected_type != "1" && (selected_mode != "1" || selected_mode != "2")) {
            if (oRetrievedResult.Werks !== sap.ui.getCore().byId("PlantInput").getValue()) {
              error_flag = 'X';
              error_message = "Barcode does not belong to the entered plant.";
            }
          }
          // Validations --- end

          if (oRetrievedResult.MessageType != 'E') {
            for (var i = 0; i < this._scannedMatData.length; i++) {
              if (oRetrievedResult.Barcode == this._scannedMatData[i].Barcode) {
                error_flag = 'X';
                error_message = "This barcode has already been scanned.";
              }
            }

            //mark is substitutable to X if its a picklist scenario
            // oRetrievedResult.IsSubsitutable
            var rbt_Mode = sap.ui.getCore().byId("RG_Mode");
            var selected_mode = rbt_Mode.getSelectedIndex();

            switch (selected_mode) { //Mode
              case 0:
                // Picklist
                // oRetrievedResult.IsSubsitutable = "X";
                oRetrievedResult.IsSubsitutable = "";
                break;

              default:
                oRetrievedResult.IsSubsitutable = "";
            }

            if (oRetrievedResult.IsSubsitutable == 'X') {
              this._pickListPopUpData = [];
              var do_not_substitute;

              for (var ipick = 0; ipick < this._pickListData.length; ipick++) {
                if (this._pickListData[ipick].Matnr == oRetrievedResult.Matnr &&
                  this._pickListData[ipick].Charg == oRetrievedResult.Ebeln &&
                  this._pickListData[ipick].BarcodeId == oRetrievedResult.Barcode
                ) {
                  do_not_substitute = 'X';
                  break;
                } else {
                  do_not_substitute = '';
                  if (this._pickListData[ipick].Bdmng >= oRetrievedResult.Tktqty) {
                    this._pickListPopUpData.push(this._pickListData[ipick]);
                  }
                }
              }

              var lst_subsitute = sap.ui.getCore().byId("PickListDataList");
              lst_subsitute.removeSelections(true);
              this.oModelSubstitute.setData(this._pickListPopUpData);
              lst_subsitute.setModel(this.oModelSubstitute);
              lst_subsitute.getModel().refresh();

              if (do_not_substitute != 'X' && error_flag != 'X') {
                if (typeof do_not_substitute !== 'undefined') {
                  if (this._pickListPopUpData.length > 0) {
                    this.subsitute_dialog.open();
                  } else {
                    sap.m.MessageToast.show("No valid barcodes found for substitution", {});
                  }
                }
              }
            }

            if (is_substitutable != 'X') {
              if (error_flag == 'X') {
                // sap.m.MessageToast.show("This barcode has already been scanned.", {});
                sap.m.MessageToast.show(error_message, {});

              } else {

                if (do_not_substitute != '') {
                  // if (typeof do_not_substitute != 'undefined') {
                  this._scannedMatData.push(oRetrievedResult);
                  this.oDataManager.addScannedMaterialData(oRetrievedResult.Barcode, oRetrievedResult);
                  var lst_mats = this.getView().byId("barcodeList");
                  lst_mats.getModel("data").refresh();
                  // }
                }

              }
            }

          } else {
            sap.m.MessageToast.show(oRetrievedResult.Message.toString(), {});
          }

          if (this._oPoQtyList) {
            var checkPoqty = true;
            for (let i = 0; i < this._oPoQtyList.length; i++) {
              if (this._oPoQtyList[i].Poqty != 0) {
                checkPoqty = false;
              }
            }

            if (checkPoqty) {
              MessageBox.success("Complete Pick List");
            }
          }

          if (this._oReturnList) {
            cReturnList = this._oReturnList.filter(o => o.Return != 'X');
            if (cReturnList.length == 0) {
              MessageBox.success("Complete Pick List");
            }
          }

        }.bind(this),
        error: function (oError) {
          sap.m.MessageToast.show("An error occured while retrieving scanned item data.", {
            duration: 3000, // default
            width: "15em", // default
            my: "center left", // default
            at: "center left", // default
            of: window, // default
            offset: "0 0", // default
            collision: "fit fit", // default
            onClose: null, // default
            autoClose: true, // default
            animationTimingFunction: "ease", // default
            animationDuration: 1000, // default
            closeOnBrowserNavigation: true // default
          });

        }
      });
      // sap.ui.core.BusyIndicator.hide(0);
      //this.scannedItem.open();
      // sap.ui.core.BusyIndicator.hide();
      this.getView().byId("input-Barcode").setValue("");
      this.getView().byId("input-Barcode").focus();
    },

    updateReason: function (oEvent) {
      sap.ui.core.Fragment.byId("rDialog", "mReasonList").setValueState("None");

      if (this._BarcodeTemp) {
        sap.ui.core.Fragment.byId("rDialog", "btn_Submit").setEnabled(true);
      }
    },

    onReasonSubmit: function (oEvent) {
      if (this._BarcodeTemp) {
        var tBarcode = this._BarcodeTemp
        var cPoList = this._oPoQtyList.filter(i => i.Matnr == tBarcode.Matnr && i.Charg == tBarcode.Batch);
        var oTktQty = this.convertDouble(tBarcode.Tktqty);
        var oGiQty = oTktQty;
        var oRemainQty = oTktQty - oGiQty;
        var oRemainPoBatch = cPoList[0].Poqty;
        var oPoQty = oRemainPoBatch - oGiQty;

        if (oRemainPoBatch >= 0) {
          tBarcode.TktQty = oTktQty;
          if (oTktQty > oRemainPoBatch) {
            tBarcode.GiQty = oRemainPoBatch;
            oGiQty = oRemainPoBatch;
          } else {
            tBarcode.GiQty = oGiQty;
          }
          tBarcode.RemainQty = oTktQty - oGiQty;
          tBarcode.PoQty = oRemainPoBatch - oGiQty;
          tBarcode.VenQty = 0;
          tBarcode.Reason = sap.ui.core.Fragment.byId("rDialog", "mReasonList").getSelectedKey();

          cPoList[0].Poqty = oRemainPoBatch - oGiQty;

          this._scannedMatData.push(tBarcode);
          this.oDataManager.addScannedMaterialData(tBarcode.Barcode, tBarcode);
          var lst_mats = this.getView().byId("barcodeList");
          lst_mats.getModel("data").refresh();

          this.onReasonCancel();

          if (this._oPoQtyList) {
            var checkPoqty = true;
            for (let i = 0; i < this._oPoQtyList.length; i++) {
              if (this._oPoQtyList[i].Poqty != 0) {
                checkPoqty = false;
              }
            }

            if (checkPoqty) {
              MessageBox.success("Complete Pick List")
            }
          }
        } else {
          MessageBox.error("This barcode exceeds Po Qty and cannot be scanned.");
          return;
        }
      } else {
        var Barcode = sap.ui.core.Fragment.byId("rDialog", "valChangeBarcode").getValue();
      }
    },

    onReasonCancel: function (oEvent) {
      this._ReasonDialog.close();
      // this._ReasonDialog.destroy(true);
      this._BarcodeTemp = {};
    },

    onReturnCancel: function (oEvent) {
      this._ReturnDialog.close();
      // this._ReasonDialog.destroy(true);
      // this._BarcodeTemp = {};
    },

    handleUserInput: function (oEvent) {
      var currentDate = new Date();
      var plantValue = sap.ui.getCore().byId("PlantInput").getValue();
      var invoiceValue = sap.ui.getCore().byId("sLocInput").getValue();
      var dateValue = sap.ui.getCore().byId("DateInput").getDateValue();

      if (plantValue !== "") {
        sap.ui.getCore().byId("PlantInput").setValueState("None");
      } else {
        sap.ui.getCore().byId("PlantInput").setValueState("Error");
      }

      if (invoiceValue !== "") {
        sap.ui.getCore().byId("sLocInput").setValueState("None");
      } else {
        sap.ui.getCore().byId("sLocInput").setValueState("Error");
      }

      if (dateValue !== null) {
        sap.ui.getCore().byId("DateInput").setValueState("None");
      } else {
        sap.ui.getCore().byId("DateInput").setDateValue(currentDate);
        sap.ui.getCore().byId("DateInput").setValueState("None");
      }

      if (plantValue !== "" && invoiceValue !== "" && dateValue !== null) {
        sap.ui.getCore().byId("btn_Confirm").setEnabled(true);
      } else {
        sap.ui.getCore().byId("btn_Confirm").setEnabled(false);
      }
    },

    handleDocInput: function (oEvent) {
      var inpDoc = sap.ui.getCore().byId("keyDoc").getValue();

      if (inpDoc !== "") {
        sap.ui.getCore().byId("keyDoc").setValueState("None");
        sap.ui.getCore().byId("btn_Done").setEnabled(true);
      }
    },

    handleChange: function (oEvent) {
      var dateValue = sap.ui.getCore().byId("DateInput").getDateValue();

      if (dateValue !== null) {
        sap.ui.getCore().byId("DateInput").setValueState("None");
      } else {
        sap.ui.getCore().byId("DateInput").setValueState("Error");
        sap.ui.getCore().byId("btn_Confirm").setEnabled(false);
      }
    },

    handleDelete: function (oEvent) {
      //var oList = oEvent.getSource(),
      //  oItem = oEvent.getParameter("listItem"),
      //  sPath = oItem.getBindingContext().getPath();
      // Validations --- start
      var rbt_Type = sap.ui.getCore().byId("RG_Type");
      var selected_type = rbt_Type.getSelectedIndex();
      var rbt_Mode = sap.ui.getCore().byId("RG_Mode");
      var selected_mode = rbt_Mode.getSelectedIndex();

      //this._scannedMatData.splice(sPath, 1);
      var oType = sap.ui.getCore().byId("keyDoc").getValue().substring(0, 1);
      var oMvmtType = sap.ui.getCore().byId("mvmtType").getSelectedKey();
      var oList = oEvent.getSource();
      var oContext = oEvent.getParameter("listItem").getBindingContext();
      var oItem = oContext.getObject();
      var oPath = oContext.getPath();
      var oIndex = oPath.slice(1);
      var m = oList.getModel();
      var data = m.getProperty("/");
      var oBarcode = data[oIndex].Barcode;

      // Return value to PO List
      // var cPoList = this._oPoQtyList.filter(i => i.Matnr == oItem.Matnr && i.Charg == oItem.Batch);
      // cPoList[0].Poqty = cPoList[0].Poqty + oItem.GiQty;

      var removed = data.splice(oIndex, 1);
      m.setProperty("/", data);

      if (selected_mode == 0 && selected_type == 0) {
        if (oType == "2") {
          this.updateVenderQty();
        }
        this.updateRemainQty();
      } else if (selected_mode == 0 && selected_type == 1) {
        this.updateReturnQty(oBarcode);
      }

      var lst_mats = this.getView().byId("barcodeList");
      lst_mats.getModel("data").refresh();
    },

    updateReturnQty: function (iBarcode) {
      var oReturnList = this._oReturnList;
      var cReturnBarcode = oReturnList.filter(o => o.Barcode == iBarcode);

      if (cReturnBarcode.length > 0) {
        cReturnBarcode[0].Return = '';
      }
    },

    updateVenderQty: function () {
      var oModelList = this._oModelList;
      var oVenderList = this._oVenQtyList;
      var oTable = this.getView().byId("barcodeList");
      var oItems = oTable.getItems();

      if (oVenderList.length > 0 && oModelList.length > 0) {
        for (let i = 0; i < oVenderList.length; i++) {
          var cMatDoc = oModelList.filter(o => o.Matnr == oVenderList[i].Matnr && o.Charg == oVenderList[i].Charg && o.Vendbatch == oVenderList[i].VendorBatch);
          if (cMatDoc.length > 0) {
            oVenderList[i].Venqty = cMatDoc[0].Venqty;
          }
        }
      }

      if (oItems.length > 0) {
        for (let i = oItems.length - 1; i >= 0; i--) {
          var oItem = oItems[i].getBindingContext().getObject();
          var cVenderList = oVenderList.filter(o => o.Matnr == oItem.Matnr && o.Charg == oItem.Batch && o.VendorBatch == oItem.VendorBatch);

          if (cVenderList.length > 0) {
            var cVenderQty = cVenderList[0].Venqty;
            var oGiQty = oItem.GiQty;

            cVenderList[0].Venqty = cVenderQty - oGiQty;
            oItem.VenQty = cVenderList[0].Venqty;
          } else {
            oItem.VenQty = 0;
          }
        }
      }
    },

    updateRemainQty: function () {
      var oModelList = this._oModelList;
      var oPoList = this._oPoQtyList;
      var oTable = this.getView().byId("barcodeList");
      var oItems = oTable.getItems();

      if (oPoList.length > 0 && oModelList.length > 0) {
        for (let i = 0; i < oPoList.length; i++) {
          var cMatDoc = oModelList.filter(o => o.Matnr == oPoList[i].Matnr && o.Charg == oPoList[i].Charg);
          if (cMatDoc.length > 0) {
            // Sum Po Qty from filter
            var oPoQty = cMatDoc.reduce((accumulator, object) => {
              return accumulator + this.convertDouble(object.Poqty);
            }, 0);

            oPoList[i].Poqty = oPoQty;
          }
        }
      }

      if (oItems.length > 0) {
        for (let i = oItems.length - 1; i >= 0; i--) {
          var oItem = oItems[i].getBindingContext().getObject();
          var cPoList = oPoList.filter(o => o.Matnr == oItem.Matnr && o.Charg == oItem.Batch);

          if (cPoList.length > 0) {
            var cPoQty = cPoList[0].Poqty;
            var oGiQty = oItem.GiQty;
            var oRemainQty = oItem.TktQty - oGiQty

            cPoList[0].Poqty = cPoQty - oGiQty;
            oItem.PoQty = cPoList[0].Poqty;
            oItem.RemainQty = oRemainQty;
          }
        }
      }
    },

    updateGRDataToSAP: function (oEvent) {

      var oMvmtType = sap.ui.getCore().byId("mvmtType").getSelectedKey();

      // Validations --- start
      var rbt_Type = sap.ui.getCore().byId("RG_Type");
      var selected_type = rbt_Type.getSelectedIndex();
      var rbt_Mode = sap.ui.getCore().byId("RG_Mode");
      var selected_mode = rbt_Mode.getSelectedIndex();

      if (selected_mode == 0 && selected_type == 0) {
        this.postOData();
      } else if (selected_mode == 0 && selected_type == 1) {
        if (this._ReturnDialog) {
          this._ReturnDialog.destroy(true);
        }

        this._ReturnDialog = sap.ui.xmlfragment("reDialog", "giconfirmation.giconfirmation.view.returnDialog", this);
        this.getView().addDependent(this._ReturnDialog);

        var oItems = this.getView().byId("barcodeList").getItems();
        var oBarQty = oItems.length;
        var sumQty = 0;

        for (let i = 0; i < oBarQty; i++) {
          var oItem = oItems[i].getBindingContext().getObject();
          sumQty = sumQty + oItem.GiQty;
        }

        sap.ui.core.Fragment.byId("reDialog", "valBarcodeQty").setValue(oBarQty);
        sap.ui.core.Fragment.byId("reDialog", "valReturnQty").setValue(sumQty);
      }

      this.getView().byId("btn_submit").setEnabled(false);
      this._ReturnDialog.open();

    },

    onReturnSubmit: function () {
      this.postOData();
      this._ReturnDialog.close();
    },

    formatDate: function (iDate) {
      var year = '' + iDate.getFullYear();
      var month = '' + (iDate.getMonth() + 1); // get Month (0-11) + 1 
      var day = '' + iDate.getDate();

      if (month.length < 2)
        month = "0" + month;
      if (day.length < 2)
        day = "0" + day;

      return day + '.' + month + '.' + year;
    },

    postOData: function () {
      var oDeepCreateGIData = {};
      var oDateValue = sap.ui.getCore().byId("DateInput").getDateValue();
      var sDate = this.formatDate(oDateValue);
      debugger
      //ID is always blank as it passes one batch at a time
      oDeepCreateGIData.Plant = sap.ui.getCore().byId("PlantInput").getValue();
      oDeepCreateGIData.PostingDate = sDate;
      oDeepCreateGIData.StorageLocation = sap.ui.getCore().byId("sLocInput").getValue();
      oDeepCreateGIData.MaterialSlip = sap.ui.getCore().byId("matSlip").getValue();

      //---Determine Mode & Type Based on the users selection
      var rbt_Type = sap.ui.getCore().byId("RG_Type");
      var selected_type = rbt_Type.getSelectedIndex();

      switch (selected_type) { //Type
        case 0:
          oDeepCreateGIData.Type = "GI";
          break;
        case 1:
          oDeepCreateGIData.Type = "GR";
          break;
        default:
          oDeepCreateGIData.Type = "GI";
      }

      var rbt_Mode = sap.ui.getCore().byId("RG_Mode");
      var selected_mode = rbt_Mode.getSelectedIndex();

      switch (selected_mode) { //Mode
        case 0:
          oDeepCreateGIData.Mode = "PL";
          break;
        case 1:
          oDeepCreateGIData.Mode = "ST";
          break;
        case 2:
          oDeepCreateGIData.Mode = "ST2";
          break;
        case 3:
          oDeepCreateGIData.Mode = "OT";
          break;
        default:
          oDeepCreateGIData.Mode = "PL";
      }

      oDeepCreateGIData.DocumentNumber = sap.ui.getCore().byId("keyDoc").getValue();
      // oDeepCreateGIData.Movement_Reason = oReason; 
      // oDeepCreateGIData.MovementReason = sap.ui.getCore().byId("mvmtReason").getSelectedKey();
      // oDeepCreateGIData.CostCentre = sap.ui.getCore().byId("valCostCentre").getValue();

      // update Reason
      var listBarcode = this._scannedMatData;
      for (let i = listBarcode.length - 1; i >= 0; i--) {
        var oItem = listBarcode[i];
        if (oItem.Reason !== undefined) {
          var filterReason = this._scannedMatData.filter(o => o.Batch == oItem.Batch && o.Matnr == oItem.Matnr && o.Reason != '' && o.Reason !== undefined);;
          for (let j = 0; j < filterReason.length; j++) {
            filterReason[i].Reason = oItem.Reason;
          }
        } else {
          oItem.Reason = "";
        }
      }

      //adjust mapping
      var binItemData = [];
      for (var iIndex = 0; iIndex < this._scannedMatData.length; iIndex++) {
        binItemData.push({
          // Id
          BarcodeNumber: this._scannedMatData[iIndex].Barcode,
          Quantity: this._scannedMatData[iIndex].GiQty.toString(),
          Batch: this._scannedMatData[iIndex].Ebeln,
          Material: this._scannedMatData[iIndex].Matnr,
          VendorBatch: this._scannedMatData[iIndex].VendorBatch,
          OriginalBarcode: this._scannedMatData[iIndex].OriginalBarcode,
          Movement_Reason: this._scannedMatData[iIndex].Reason
        });
      }
      oDeepCreateGIData.scanHeaderItem = binItemData;

      var _scannedMatData = this._scannedMatData;
      var lst_mats = this.getView().byId("barcodeList");
      debugger;
      this._oModel.create("/postScanDataHeaderSet", oDeepCreateGIData, {

        success: function (oData, sStatus, oResponse) {
          for (var i = 0; i < _scannedMatData.length; i++) {
            for (var j = 0; j < oData.scanHeaderItem.results.length; j++) {
              if (oData.scanHeaderItem.results[j].BarcodeNumber === _scannedMatData[i].Barcode) {
                _scannedMatData[i].Status = oData.scanHeaderItem.results[j].Status;
              }
            }
          }
          this._scannedMatData = _scannedMatData;
          lst_mats.getModel("data").refresh();

        }.bind(this),
        error: function (oError) {
          if (!oError.responseJSON && oError.responseText) {
            oError.responseJSON = JSON.parse(oError.responseText);
          }
          MessageBox.error(oError.responseJSON.error.message.value);
        }
      });
      this._scannedMatData = _scannedMatData;
    }

  });

});