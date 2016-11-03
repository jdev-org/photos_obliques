Ext.namespace("GEOR.Addons.Photos_obliques");

GEOR.Addons.Photos_obliques = Ext.extend(GEOR.Addons.Base, {

    window: null,
    actions: null,

    /**
     * Method: init
     * 
     * @param: record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {

        if (this.map instanceof GeoExt.MapPanel) {
            this.map = this.map.map;
        }

        if (!this.map) {
            this.map = GeoExt.MapPanel.guess().map;
        }

        // if no toggleGroup was defined, set to this.map.id
        if (!this.toggleGroup) {
            this.toggleGroup = this.map.id;
        }

        var actionItems = [];

        var attributesAction = new Ext.Action({
            id: "attriMenuBtn",
            iconCls: "action-graph-icon",
            text: "Attributaire",
            allowDepress: false,
            pressed: false,
            enableToggle: true,
            toggleGroup: "menuBtn",
            iconAlign: "top",
            checked: false
        });

        var graphAction = new Ext.Action({
            id: "graphMenuBtn",
            iconCls: "action-graph-icon",
            text: "Graphique",
            allowDepress: false,
            pressed: false,
            enableToggle: true,
            toggleGroup: "menuBtn",
            iconAlign: "top",
            checked: false
        });

        var basketAction = new Ext.Action({
            id: "basketMenuBtn",
            iconCls: "action-basket-icon",
            text: "Panier",
            allowDepress: false,
            pressed: false,
            enableToggle: true,
            toggleGroup: "menuBtn",
            iconAlign: "top",
            checked: false
        });

        actionItems.push(attributesAction);
        actionItems.push('-');
        actionItems.push(graphAction);
        actionItems.push('-');
        actionItems.push(basketAction);

        this.window = new Ext.Window({
            title: "Outils pour photos obliques",
            id: "photoOblique_window",
            closable: true,
            minWidth: 200,
            minHeight: 71,
            maxHeight: 100,
            maxWidth: 200,
            closeAction: "hide",
            border: false,
            constrainHeader: true,
            items: [{
                xtype: 'toolbar',
                border: false,
                buttonAlign: 'center',
                items: actionItems
            }],
            listeners: {
                "hide": function() {},
                "show": function() {}
            }
        });

        if (this.target) {

            // create a button to be inserted in toolbar:

            this.components = this.target.insertButton(this.position, {
                xtype: 'button',
                tooltip: this.getTooltip(record),
                id: "component",
                pressed: false,
                iconCls: "addon-photo-icon",
                handler: this._onCheckchange,
                scope: this
            });

            this.target.doLayout();

            // create a menu item for the "tools" menu:
            this.item = new Ext.menu.CheckItem({
                text: this.getText(record),
                qtip: this.getQtip(record),
                id: "item",
                iconCls: "addon-photo-icon",
                checked: false,
                listeners: {
                    "checkchange": this._onCheckchange,
                    scope: this
                }
            });
        }
    },

    /**
     * Method: _onCheckchange Callback on checkbox state changed
     */
    _onCheckchange: function(item, checked) {
        if (checked && !this.window.isVisible()) {
            this.window.show();
        } else {
            this.window.hide();
        }
    },

    /**
     * Method: destroy Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        if (this.window) {
            this.window.hide();
        }
        GEOR.Addons.Base.prototype.destroy.call(this);
    }

});