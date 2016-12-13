Ext.namespace("GEOR.Addons.Photos_obliques.result");

/*
 * ID SPECIFICATION : (addon)_(type)_(label or text or name if exist)_(container or
 * name"s function) ex: [phob_win_main_sba] is the id of the main window to
 * search by attribute in oblique photo addon
 */
GEOR.Addons.Photos_obliques.result.createResultLayers = function(map) {
    var epsg3948 = new OpenLayers.Projection("EPSG:3948");
    var tempLayer, extendLayer;

    if (map) {

        // if layer already exit, remove it
        if (map.getLayersByName("phob_tempResultLayer").length == 0 && map.getLayersByName("phob_extendResultLayer").length == 0) {
            // create layer and add to map
            var styleMap = new OpenLayers.StyleMap(GEOR.Addons.Photos_obliques.globalOptions.styleMapOptions);
            var templayerOptions = OpenLayers.Util.applyDefaults(
                this.layerOptions, {
                    displayInLayerSwitcher: false,
                    projection: map.getProjectionObject(),
                    styleMap: styleMap,
                    preFeatureInsert: function(feature) {
                        feature.geometry.transform(epsg3948, map.getProjectionObject());
                    }
                }
            );
            tempLayer = new OpenLayers.Layer.Vector("phob_tempResultLayer", templayerOptions);

            var extendStyleMap = new OpenLayers.StyleMap({
                "fill": false,
                "stroke": false
            });
            var extendlayerOptions = OpenLayers.Util.applyDefaults(
                this.layerOptions, {
                    displayInLayerSwitcher: false,
                    projection: map.getProjectionObject(),
                    styleMap: extendStyleMap,
                    preFeatureInsert: function(feature) {
                        feature.geometry.transform(epsg3948, map.getProjectionObject());
                    }
                }
            );
            extendLayer = new OpenLayers.Layer.Vector("phob_extendResultLayer", extendlayerOptions);

            var addLayers = function(map, tempLayer, extendLayer) {
                map.addLayer(tempLayer)
                extendLayer.styleMap.styles.default.defaultStyle.strokeOpacity = 0;
                map.addLayer(extendLayer);
            };
            return addLayers(map, tempLayer, extendLayer);
        }

    }

};


/**
 * Create window to display image
 */
GEOR.Addons.Photos_obliques.createResulttWindow = function(htmlImg,name) {
    var window = new Ext.Window({
        id: "phob_win_display",
        title:name,
        autoHeight: true,
        modal: true,
        autoWidth: true,
        autoScroll: true,
        closable: true,
        html:htmlImg || (htmlImg !== null) ? htmlImg : ""
    });
    return window;
};

GEOR.Addons.Photos_obliques.manageResultWindow = function(htmlImg,name){
    if (Ext.getCmp("phob_win_display")) {
        Ext.getCmp("phob_win_display").destroy();
        GEOR.Addons.Photos_obliques.createResulttWindow(htmlImg,name).show();
    } else {
        GEOR.Addons.Photos_obliques.createResulttWindow(htmlImg,name).show();
    }
}  


/**
 * Create grid panel wich contain all result find by geographic or attributes tools
 */

GEOR.Addons.Photos_obliques.result.gridPanel = function() {
    var epsg3948 = new OpenLayers.Projection("EPSG:3948");
    var gridStore, gridPanel;
    var nbElementByPage = 10;
    var nbResultMax = 20;
    var defaultMaxReponse = 200;
    var indexLine;
    var map = GeoExt.MapPanel.guess().map ? GeoExt.MapPanel.guess().map : null;
    var maxCartSize = GEOR.Addons.Photos_obliques.globalOptions.cartSize;
    var maxCartNb = GEOR.Addons.Photos_obliques.globalOptions.cartNb;



    var createFeature = function(coordinates, layer) {
        var vertices = [];
        // if value exist create polygon from reproject coordinates and add to layer 
        if (coordinates != null) {
            for (i = 0; i < coordinates.length; i++) {
                var point = new OpenLayers.Geometry.Point(coordinates[i][0], coordinates[i][1]);
                vertices.push(point);
            }
            var ring = new OpenLayers.Geometry.LinearRing(vertices);
            var createPolygon = new OpenLayers.Geometry.Polygon([ring]);
            var feature = new OpenLayers.Feature.Vector(createPolygon);
            if (layer) {
                layer.addFeatures(feature);
            } else {
                var getVertices = feature.geometry.getVertices();
                var transformedVertices = [];
                for (var i = 0; i < getVertices.length; i++) {
                    transformedVertices.push(getVertices[i].transform(epsg3948, map.getProjectionObject()));
                }
                var ringProj = new OpenLayers.Geometry.LinearRing(transformedVertices);
                var createPolygonProj = new OpenLayers.Geometry.Polygon([ringProj]);
                var featureProj = new OpenLayers.Feature.Vector(createPolygonProj);
                return featureProj;
            }
        }
    };
    
    
    /**
     * Create grid panel store
     **/
    
    GEOR.Addons.Photos_obliques.result.resultStore = new Ext.data.JsonStore({
        id: "phob_store_",
        proxy: new Ext.data.HttpProxy({
            url: GEOR.Addons.Photos_obliques.globalOptions.servicesUrl+"/getPhotoByAttribute",
            method: 'GET',
            //autoLoad: true
        }),
        root: "rows",
        sortInfo: {
            field: "date",
            direction: "ASC"
        },
        fields: [
            "photoId", "owner", "origin","size", "downloadable","geom",{
                name: "date",
                convert: function(v, rec) {
                    var dt = new Date(rec.date);
                    return dt;
                }
            },{
                name:"url",
                convert:function(v,rec){
                    var urlThumb = GEOR.Addons.Photos_obliques.globalOptions.thumbUrl + (rec.photoId + ".jpg");
                    return urlThumb;
                }
            }
        ],
        autoLoad: {
            params:{
                start: 0, 
                limit: GEOR.Addons.Photos_obliques.globalOptions ? GEOR.Addons.Photos_obliques.globalOptions.limitByPage : nbElementByPage
            }
        },        
        listeners: {
            "load": function() {
                var gridPanel = Ext.getCmp("phob_grid_resultPan");
                var limit = GEOR.Addons.Photos_obliques.globalOptions.limitReturns ?  GEOR.Addons.Photos_obliques.globalOptions.limitReturns : defaultMaxReponse;
                if(this.totalLength > limit){                    
                    gridPanel.collapse();
                    gridPanel.getStore().removeAll();
                    Ext.Msg.alert("Echec de la requête", "Résultat trop important, veuillez modifier vos critères de recherche");
                } else {
                    gridPanel.expand();
                    // zoom sur l'étendue de la couche
                    if (map) {                   
                        if (gridStore.data.items.length > 0) {
                            var layer = map.getLayersByName("phob_extendResultLayer")[0];
                            for (b = 0; b < gridStore.data.items.length; b++) {
                                var rec = gridStore.data.items[b].data.geom;
                                var geomCoord = rec ? rec.coordinates[0] : null;
                                var feature = createFeature(geomCoord, layer);
                            }
                            map.zoomToExtent(layer.getDataExtent());
                        }                    
                    }
                }                
            }
        },
        totalProperty: 'results'
    });

    gridStore = GEOR.Addons.Photos_obliques.result.resultStore;
    
    // Correction d'anomalie : forcer la mise à jour de l'ombre de la fenêtre
    function updateShadow() {
        if (Ext.getCmp("phob_win_search")) {
            return Ext.getCmp("phob_win_search").syncShadow();
        }
    }

    // Déclaration de la bottom bar (50 images par page)
    var bbar = new Ext.PagingToolbar({
        pageSize: GEOR.Addons.Photos_obliques.globalOptions ? GEOR.Addons.Photos_obliques.globalOptions.limitByPage : nbElementByPage,
        store: gridStore,
        displayInfo: true,
        displayMsg: 'Affichage {0} - {1} of {2}',
        emptyMsg: "Pas d'images a afficher",
    });
    
    var sizeBar = new Ext.ProgressBar({
        id:"phob_size_pBar"

     });
    
    var nbBar = new Ext.ProgressBar({
        text:'Ready',
        id:"phob_nb_pbar",
        width: 100,
        maxWidth:100
    });
    
    
    var createBbar = function(){
        var div;
        var items = [];                        
        
        items.push({
            html: '<div id="phob_sizeBar"><div id="phob_sizeBarProg"><div id="phob_sizeBarLabel">0/0</div></div></div>',
            xtype: "panel",
            width:100,
            id:"panelsizeBar"
        });        
        
        items.push("-");
        items.push({
            html: '<div id="phob_nbBar"><div id="phob_nbBarProg"><div id="phob_nbBarLabel">0/0</div></div></div>',
            xtype: "panel",
            width:100,
            id:"panelNbBar"
        });        
    
            
        items.push("->");
        
        items.push({
            xtype: "button",
            iconCls: "phob-clean-icon",
            id: "phob_btn_clRes",
            handler: function() {
                gridStore.removeAll();
                gridPanel.collapse();
            }
        });
        
        items.push({
            xtype: "button",
            id: "phob_btn_csvRes",
            iconCls: "phob-csv-icon"
        });
        
        return {
            id:"tb_result",
            items:items
        }
    };
    
    var updateBar = function(currentNb, currentSz, maxCartNb, maxCartSize){
        // get current progress width
        var nbProgress = document.getElementById("phob_nbBarProg").offsetWidth;
        var szProgress = document.getElementById("phob_sizeBarProg").offsetWidth;
        // get current bar Width
        var xSzWidth = document.getElementById("phob_sizeBar").offsetWidth;
        var xNbWidth = document.getElementById("phob_nbBar").offsetWidth;

        // calcul new width for progress bar
        var nbProgressTo = xSzWidth * ( currentNb / maxCartNb );
        var szProgressTo = xNbWidth * ( currentSz / maxCartSize );
        
        // udpate progress bars 
        for(i=nbProgress; i<nbProgressTo; i=i+1){
            if(i<xNbWidth){
                document.getElementById("phob_nbBarProg").style.width = i + "px";                
            }            
        }
        
        for(i=szProgress; i<szProgressTo; i = i + 1){
            if(i<xSzWidth){
                document.getElementById("phob_sizeBarProg").style.width = i + "px";
                document.getElementById("phob_nbBarLabel").innerHTML = i + "/" + maxCartNb;
            }            
        }
        
        // udpate labels
        document.getElementById("phob_nbBarLabel").innerHTML = currentNb + " / " + maxCartNb;
        document.getElementById("phob_sizeBarLabel").innerHTML = currentSz + " / " + maxCartSize + "Mo";                        
    };
    
    // Create grid panel and items
    gridPanel = new Ext.grid.GridPanel({
        id: "phob_grid_resultPan",
        store: gridStore,
        collapsible: true,
        title: "Résultat",
        stripeRows: true,
        tbar: new Ext.Toolbar(createBbar()),
        maxHeigth: 400,
        minHeigth: 200,
        autoHeigth: true,
        collapsed: true,
        colModel: new Ext.grid.ColumnModel({
            defaults: {
                align: "center"
            },
            columns: [{
                xtype: "actioncolumn",
                id: "phob_col_photoRes",
                header: 'Photo',
                dataIndex: 'url',
                renderer: function(value) {
                    return '<img src="' + value + '" width="50" height="50" borer="0" />';
                },
                listeners: {
                    "click": function(val, meta, rec) {
                        var rowIndex = rec;
                        var record = gridPanel.getStore().getAt(rowIndex);
                        var photoName = record ? record.data.photoId : null;
                        var url = GEOR.Addons.Photos_obliques.globalOptions.photoUrl + photoName+".jpg";
                        var htmlImg = '<img src="' + url + '" borer="2" />';
                        GEOR.Addons.Photos_obliques.manageResultWindow(htmlImg,photoName);
                    }
                }
            }, {
                xtype: "actioncolumn",
                id: "phob_col_zoomRes",
                header: "Zoom",
                dataIndex: 'geometry',
                items: [{
                    tooltip: "Zoomer sur l'emprise",
                    getClass: function(val, meta, rec) {
                        return "phob-zoom-icon";
                    },
                    handler: function(val, meta, rec) {
                        var rowIndex = meta;
                        var record = gridPanel.getStore().getAt(rowIndex);
                        var geomCoord = record ? record.data.geom.coordinates[0] : null;

                        var feature = createFeature(geomCoord, false);
                        map.zoomToExtent(feature.geometry.getBounds());
                    }
                }]
            }, {
                id: "phob_col_dateRes",
                header: "Date",
                sortable: true,
                dataIndex: "date",
                renderer: Ext.util.Format.dateRenderer("d-m-Y")
            }, {
                id: "phob_col_IdRes",
                header: "ID",
                dataIndex: "photoId"
            }, {
                id: "phob_col_ownerRes",
                header: "Propriétaire",
                sortable: true,
                dataIndex: "owner"
            }, {
                id: "phob_col_sizeRes",
                header: "Taille Mo",
                sortable: true,
                dataIndex: "size"
            }, {
                id: "phob_col_prestRes",
                header: "Prestataire",
                sortable: true,
                dataIndex: "origin"
            }, {
                xtype: "actioncolumn",
                id: "phob_col_cartRes",
                tooltip: "Ajouter au panier", // TODO : Créer une variable de conf dans le config.json
                header: "Panier",
                getClass: function(val, meta, rec) {
                    if (rec.get("downloadable") !== 1) {
                        this.tooltip = GEOR.Addons.Photos_obliques.globalOptions.adminMsgTooltip;
                        this.handler = function() {
                            Ext.MessageBox.alert("Contact", GEOR.Addons.Photos_obliques.globalOptions.adminMsgAlert);
                        };
                        return "phob-call-icon";
                    } else {
                        this.tooltip = "Ajouter au panier";
                        this.handler = function(val,meta,rec) {                            
                            // control size of cart
                            var photoDt = gridPanel.getStore().getAt(meta).data;
                            var cartStore = Ext.getCmp("phob_dataView").getStore();
                            var dbl;
                            var sumSize = 0;
                            for (i=0; i < cartStore.data.items.length; i++){
                                var dt = cartStore.data.items[i].data;
                                sumSize = sumSize + dt.size;
                                dbl = (photoDt.photoId !== dt.photoId ) ? false : true ;
                            }                            
                            
                            // on vérifie que l'image n'est pas déjà dans le panier
                            if(!dbl){
                                var sizeAfterAdd = sumSize + photoDt.size;
                                var countAfterAdd = cartStore.getCount() + 1 ;
                                
                                // on vérifie que les capacités du panier ne sont pas atteintes
                                if (sizeAfterAdd > maxCartSize || countAfterAdd > maxCartNb){
                                    Ext.MessageBox.alert("Limite du panier atteinte", "Impossible d'ajouter la sélection");                                
                                } else {
                                    var resultStore = Ext.getCmp("phob_dataView").getStore();
                                    var photoName = gridPanel.getStore().getAt(meta).data.photoId;
                                    var urlMini =  GEOR.Addons.Photos_obliques.globalOptions.photoUrl + photoName + ".jpg"; 
                                    var data = gridPanel.getStore().getAt(meta).data;
                                    data.url = urlMini;
                                    delete data["downloadable"];
                                    delete data["geom"];
                                    delete data["origin"];
                                    delete data["owner"];
                                    var newRecord = new resultStore.recordType(data);
                                    resultStore.insert(resultStore.data.length, newRecord);                                
                                    
                                    //update progress bar
                                    updateBar(countAfterAdd,sizeAfterAdd,maxCartNb,maxCartSize);
                                    
                                }
                            } else {
                                Ext.MessageBox.alert("Doublon", "Cette image est déjà ajoutée");
                            } 

                        };
                        return "phob-add-icon";
                    }
                }                
            }]
        }),
        viewConfig: {
            forceFit: true
        },
        cls: "grid-result-panel",
        listeners: {
            "expand": updateShadow,
            "collapse": updateShadow,
            /*"mouseover": function(e, t) {
                if (GeoExt.MapPanel.guess().map.getLayersByName("phob_tempResultLayer").length !== 0) {
                    var layer = GeoExt.MapPanel.guess().map.getLayersByName("phob_tempResultLayer")[0];

                    // get number of row and search this index in store data. Note that number change in store to if user sort column
                    var rowIndex = gridPanel.getView().findRowIndex(t);
                    var rec = gridPanel.getStore().getAt(rowIndex);
                    var geomCoord = rec ? rec.data.geom.coordinates[0] : null;
                    createFeature(geomCoord, layer);
                }
            },*/
            "mouseout": function() {
                // destroy features if row is not over by mouse
                GeoExt.MapPanel.guess().map.getLayersByName("phob_tempResultLayer")[0].destroyFeatures();

            },
            scope: this
        },
        bbar: bbar
    });

    var gridView = gridPanel.getView();
    gridView.on("");
    
    GEOR.Addons.Photos_obliques.result.gridPanel = gridPanel;

    return  GEOR.Addons.Photos_obliques.result.gridPanel;
};