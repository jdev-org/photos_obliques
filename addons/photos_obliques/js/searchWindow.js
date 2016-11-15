Ext.namespace("GEOR.Addons.Photos_obliques.search");

/*
 * ID SPECIFICATION : (addon)_(type)_(label or text or name if exist)_(container
 * or name's function) ex: [phob_win_main_sba] is the id of the main window to
 * search by attribute in oblique photo addon
 */

GEOR.Addons.Photos_obliques.onSearch = function(button) {
    if (GEOR.Addons.Photos_obliques.search.mainWindow == null || GEOR.Addons.Photos_obliques.search.mainWindow.isDestroyed == true) {
        GEOR.Addons.Photos_obliques.initSearchWindow(button.id);

    } else if (GEOR.Addons.Photos_obliques.search.mainWindow.isVisible() && !button.checked) {
        GEOR.Addons.Photos_obliques.search.mainWindow.hide();
        button.toggle(false);
    } else {
        // TODO : manage attributes fieldSet if last search was not null
        if (button.id === "phob_btn_graph") {
            Ext.getCmp("phob_fst_mainSba").disable();
            Ext.getCmp("phob_btn_fire").disable();
        } else if (button.id === "phob_btn_attribut") {
            Ext.getCmp("phob_fst_mainSba").enable();
            Ext.getCmp("phob_btn_fire").enable();

        }
        GEOR.Addons.Photos_obliques.search.mainWindow.show();
    }
};

GEOR.Addons.Photos_obliques.initSearchWindow = function(id) {
    var formItems = [];
    var searchBtn, cancelBtn;

    /**
     * Add panels to search window
     */

    var winTitle = "Outils de recherche attributaire";
    formItems.push(GEOR.Addons.Photos_obliques.search.sbgPanel());
    formItems.push(GEOR.Addons.Photos_obliques.search.searchByAttributes());
    formItems.push(GEOR.Addons.Photos_obliques.result.gridPanel());

    var formPanel = new Ext.form.FormPanel({
        items: formItems
    });

    searchBtn = new Ext.Button({
        labelAlign: "center",
        id: "phob_btn_fire",
        text: "Rechercher",
        handler: function() {
            if (!Ext.getCmp("phob_form_mainSbg").hidden) {
                Ext.getCmp("phob_fst_mainSba").enable();
            }
        }
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
     * Manage items if window should display graphic research tools first
     */

    if (id === "phob_btn_graph") {
        Ext.getCmp("phob_form_mainSbg").hidden = false;
        winTitle = "Recherche graphique";
        Ext.getCmp("phob_fst_mainSba").disable();
        searchBtn.disable();
    }
    
    /**
     * to update shadow when resize window
     */
    
    function updateShadow() {
        if (Ext.getCmp("phob_win_search_graph")) {
            return Ext.getCmp("phob_win_search_graph").syncShadow();
        }
    }

    GEOR.Addons.Photos_obliques.search.mainWindow = new Ext.Window({
        title: winTitle,
        id: "phob_win_search_graph",
        autoScroll: true,
        widht: 500,
        autoHeight: true,
        minWidth: 280,
        closeAction: "hide",
        closable: true,
        items: [formPanel],
        listeners: {
            "expand": updateShadow,
            "collapse": updateShadow,
            "hide": function() {
                // unpressed all button and deactive all search by graphic content
                Ext.getCmp("phob_btn_graph").toggle(false);
                Ext.getCmp("phob_btn_attribut").toggle(false);
                var drawBtn = Ext.getCmp("phob_btn_delSbg");
                drawBtn.fireEvent("click", drawBtn);
            },
            scope: this
        },
        buttons: [searchBtn, cancelBtn]
    });

    GEOR.Addons.Photos_obliques.search.mainWindow.show();
};