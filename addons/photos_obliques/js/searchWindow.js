Ext.namespace("GEOR.Addons.Photos_obliques.search");

/*
 * ID SPECIFICATION : (addon)_(type)_(label or text or name if exist)_(container
 * or name's function) ex: [phob_win_main_sba] is the id of the main window to
 * search by attribute in oblique photo addon
 */

GEOR.Addons.Photos_obliques.onSearch = function(button) {
    // Creation de la la fenetre si non existante
    if (GEOR.Addons.Photos_obliques.search.mainWindow == null || GEOR.Addons.Photos_obliques.search.mainWindow.isDestroyed == true) {
        GEOR.Addons.Photos_obliques.initSearchWindow(button.id);
    // si l'outil demandé est déjà ouvert, le fermer
    } else if (GEOR.Addons.Photos_obliques.search.mainWindow.isVisible() && !button.checked) {
        GEOR.Addons.Photos_obliques.search.mainWindow.hide();
        button.toggle(false);
    // sinon, ouverture de l'autre outil de recherche
    } else {
        if (button.id === "phob_btn_graph") {
            Ext.getCmp("phob_fst_mainSba").hide();
            Ext.getCmp("phob_fst_mainSbg").show();
            Ext.getCmp("phob_btn_fire").disable();
            Ext.getCmp("phob_fst_mainSbg").disable();

        } else if (button.id === "phob_btn_attribut") {
            // on efface le dessin et on désactive le composite field
            var delBtn = Ext.getCmp("phob_btn_delSbg");
            delBtn.fireEvent("click", delBtn);
            Ext.getCmp("phob_fst_mainSbg").hide();
            Ext.getCmp("phob_fst_mainSba").show();
            Ext.getCmp("phob_btn_fire").enable();           
            
        }
        GEOR.Addons.Photos_obliques.search.mainWindow.show();        
    }
    // dans tous les cas, nettoyer la liste de résultat
    if(GEOR.Addons.Photos_obliques.result.gridPanel){
        GEOR.Addons.Photos_obliques.result.gridPanel.getStore().removeAll();
        GEOR.Addons.Photos_obliques.result.gridPanel.collapse();
    }
};

GEOR.Addons.Photos_obliques.initSearchWindow = function(id) {
    var epsg3948 = new OpenLayers.Projection("EPSG:3948");
    var formItems = [];
    var searchBtn = false;
    var cancelBtn;
    
    var winTitle = "Recherche attributaire";

    /**
     * Add panels to search window
     */
    var idGraph = "phob_fst_mainSbg";
    var idAtt = "phob_fst_mainSba";
    formItems.push(GEOR.Addons.Photos_obliques.search.sbgPanel());
    formItems.push(GEOR.Addons.Photos_obliques.search.cpField(idGraph));
    formItems.push(GEOR.Addons.Photos_obliques.search.cpField(idAtt));
    formItems.push(GEOR.Addons.Photos_obliques.result.gridPanel());
    
    var formPanel = new Ext.form.FormPanel({
        items: formItems,
        id: "phob_form_winSearch"
    });
        
    cancelBtn = new Ext.Button({
        labelAlign: "center",
        id: "phob_btn_cancel",
        text: "Annuler",
        handler: function() {
            GEOR.Addons.Photos_obliques.search.mainWindow.hide();
        }
    });

    /**
     * Manage items for the first display
     */

    if (id === "phob_btn_graph") {
        Ext.getCmp(idGraph).disable()
        Ext.getCmp("phob_form_mainSbg").hidden = false;        
        Ext.getCmp(idAtt).hide();        
        winTitle = "Recherche graphique";
        searchBtn = true;
    } else {
        Ext.getCmp(idGraph).hide();
    }    

    GEOR.Addons.Photos_obliques.search.mainWindow = new Ext.Window({
        title: winTitle,
        id: "phob_win_search",
        resizable: true,
        constrainHeader: true,
        autoScroll: true,
        width: 500,
        autoHeight: true,
        minWidth: 280,
        maxHeigth:500,
        closeAction: "hide",
        closable: true,
        items: [formPanel],
        listeners: {
            "hide": function() {
                // unpressed all button and deactive all search by graphic content
                Ext.getCmp("phob_btn_graph").toggle(false);
                Ext.getCmp("phob_btn_attribut").toggle(false);
                var delBtn = Ext.getCmp("phob_btn_delSbg");
                delBtn.fireEvent("click", delBtn);
            },
            scope: this
        },
        buttons: [{
            labelAlign: "center",
            id: "phob_btn_fire",
            text: "Rechercher",
            disabled: searchBtn,
            listeners: {
                "click": function() {
                    if(GEOR.Addons.Photos_obliques.search.mainWindow.title === "Recherche attributaire"){
                        var getTitle = GEOR.Addons.Photos_obliques.search.mainWindow.title;
                        if (getTitle == "Recherche attributaire"){
                            var params;
                            var nbResultMax = 100;
                            var store;
                            var searchForm = GEOR.Addons.Photos_obliques.search.mainWindow.items.items[0].getForm();
                            var searchParams = searchForm.getValues();                            
                            var resultStore = GEOR.Addons.Photos_obliques.result.resultStore;                            
                            resultStore.baseParams = searchParams;
                            searchParams.start = 0;
                            searchParams.limit = 5
                            var citiesParams = searchParams.cities;
                            searchParams.cities = citiesParams.split(/[,]/);
                        
                            GEOR.Addons.Photos_obliques.result.resultStore.load({
                                params:searchParams
                            });
                            GEOR.Addons.Photos_obliques.search.mainWindow.doLayout();                                                                     
                        }
                    } else {
                        if(GeoExt.MapPanel.guess().map.getLayersByName("phob_layer_sbg").length > 0){
                            var feature = GeoExt.MapPanel.guess().map.getLayersByName("phob_layer_sbg")[0].features.length == 1 ? GeoExt.MapPanel.guess().map.getLayersByName("phob_layer_sbg")[0].features[0] : null ;
                            if (feature !== null){
                                var globalOptions = GEOR.Addons.Photos_obliques.globalOptions;
                                var reprojGeom = feature.geometry.transform(new OpenLayers.Projection("EPSG:3857"),epsg3948);
                                var featureCC =  new OpenLayers.Feature.Vector(reprojGeom);
                                var geomInWkt = new OpenLayers.Format.WKT().write(featureCC);
                                
                                // set request options
                                var settings  = globalOptions.WFSLayerSetting;                                
                                settings.maxfeatures = globalOptions.limitReturns;
                                settings.cql_filter = "WITHIN(" + settings.geometryField +","+geomInWkt+")";

                                // create request
                                var request = new OpenLayers.Request.GET({
                                    url: globalOptions.WFSLayerUrl,
                                    params: settings,
                                    async: false,
                                    callback: function(request) {
                                        // read json and zoom to extent
                                        if (request.responseText) {
                                            var rep = request.responseText;                                            
                                            var jsonData = Ext.util.JSON.decode(rep);
                                            if (jsonData.totalFeatures > globalOptions.limitReturns){
                                                Ext.Msg.alert("Echec de la requête", "Résultat trop important, veuillez modifier vos critères de recherche");
                                            }/* else {
                                                if(GEOR.Addons.Photos_obliques.result.resultStore){
                                                    var resStore = GEOR.Addons.Photos_obliques.result.resultStore;
                                                    
                                                }
                                            }*/                                           
                                        } else {
                                            console.log("Error ", request.responseText);
                                        }
                                    }
                                });
                            }
                            
                        }                        
                    } 
                }
            }
        }, cancelBtn]
    });

    GEOR.Addons.Photos_obliques.search.mainWindow.show();
};