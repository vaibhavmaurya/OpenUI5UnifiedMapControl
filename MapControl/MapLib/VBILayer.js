sap.ui.define([

  "sap/ui/vbm/GeoMap",
  "sap/ui/vbm/Spots",
  "sap/ui/vbm/Spot",
  "sap/ui/vbm/Areas",
  "sap/ui/vbm/Area",
  "sap/ui/vk/MapContainer",
  "sap/ui/vk/ContainerContent"

], function (GeoMap, Spots, Spot, Areas, Area, MapContainer, ContainerContent) {
  "use strict";

  var iDefaultZoom = 2,
    sDefaultCenterPostion = "0;0",
    iOnMarkerZoom = 8, bGeoMapDestroyed = false,
    sPoint = 'Point';


  return {


    isMapInstanceAlive : function(){
      return !!this.oGeoMap && !this.oGeoMap.bIsDestroyed;
      
    },

    getMapInstance : function(){
      return this.oGeoMap;
    },

    resolveMapProvider : function(oMapProvider){
        switch(oMapProvider.MapProviderName){
          case 'here': return oMapProvider.MapProviderUrl+"?app_id="+oMapProvider.ApiKey+"&app_code="+oMapProvider.ApiCode;
          case 'esri': return oMapProvider.MapProviderUrl;
          case 'osm': return oMapProvider.MapProviderUrl;
        }
    },

    init: function (oMapProvider) {
      var oSpots = new Spots();
      var oAreas = new Areas();
      var bContainerDestroyed = bGeoMapDestroyed;
      bContainerDestroyed = false;
      var oVBIPrint = new GeoMap({
        width: '100%',
        height: '100%', 
        vos: [oSpots, oAreas],
        containerDestroyed : function(){
            bContainerDestroyed = true;
        }.bind(this)
      });
      this.oGeoMap = oVBIPrint;
      this.oSpots = oSpots;
      this.oAreas = oAreas;

      var resolveMap = this.resolveMapProvider;

      return $.Deferred(function () {
        var self = this;
        var url = resolveMap(oMapProvider);
        var oMapConfig = {
          MapProvider: [
            {
              name: oMapProvider.MapProviderName,
              copyright: oMapProvider.copyright_info||"",
              description:"",
              Source: [
                {
                  id: "all-map",
                  url: url
                }
              ]
            }
          ],
          MapLayerStacks: [
            {
              name: "DEFAULT",
              MapLayer: {
                name: "layer1",
                // opacity: 0.8,
                refMapProvider: oMapProvider.MapProviderName
              }
            }
          ]
        };
        oVBIPrint.setMapConfiguration(oMapConfig);
        oVBIPrint.setRefMapLayerStack("DEFAULT");
        self.resolve(
          oVBIPrint
        );
      });
    },

    // External methods
        
    bindAreas: function (o) {
      this.oAreas.bindAggregation("items",
        {
          path: o.path,
          template: new Area({
            key: "{key}",
            // labelBgColor:"rgb(230, 242, 255)",
            // labelBorderColor:"rgb(0, 62, 128)",
            color:"rgba(92;186;230;0.6)",
            colorBorder:"rgba(118,118,118,0.6)",
            // hotDeltaColor:"rgba(7, 45, 162, 1)",
            position: {
              path: "pos",
              formatter: function (val) {
                var c = val[0].map(function(a){
                    return [a[0],a[1],0].join(";");
                });
                return c.join(";");
              }
            },
            tooltip: "{tooltip}"
          })
        });
    },    

    bindSpots: function (o, fnMarkerPress) {
      this.oSpots.bindAggregation("items",
        {
          path: o.path,
          template: new Spot({
            key: "{key}",
            position: {
              path: "pos",
              formatter: function (val) {
                val.push(0);
                return val.join(";");
              }
            },
            tooltip: "{tooltip}",
            click: function (oEvent) {
              fnMarkerPress({
                source: this,
                data: this.getBindingContext().getObject()
              });
            }
          })
        });
    },

    // Private functions
    _findItemByKey : function(sKey){
      if (!sKey) {return null;}
        var aSpots = this.oSpots.getItems(), i = 0;
        var aAreas = this.oAreas.getItems();
        var iAreas = aAreas.length, iSpots = aSpots.length;
        var iLength = iAreas > iSpots? iAreas : iSpots;

        for (i = 0; i < iLength; i += 1) {
          if (i < iSpots && aSpots[i].getKey() === sKey.toString()) {
            return {item: aSpots[i], isSpot:true};
          }
          if (i < iAreas && aAreas[i].getKey() === sKey.toString()) {
            return {item:aAreas[i], isSpot:false};
          }         
        }

        return null;
    },

    zoomByKey : function(sKey){
      var oItem = this._findItemByKey(sKey);
      if(!!oItem){
        this._setMapElementSelection(oItem.item, oItem.isSpot);
      }else{
        this.resetMapPositionAndZoom();
      }
    },    

    _setMapElementSelection: function (oMapElement, bSpot) {
      if(!oMapElement){return;}
      if(bSpot){
        this.oGeoMap.setCenterPosition(oMapElement.getPosition());
        this.oGeoMap.setZoomlevel(iOnMarkerZoom);
      }else{
        this.oGeoMap.zoomToAreasById([oMapElement.getId()],1);
      }
    },    

    // MARKER ACTIONS:


    setSelectedMapElement: function (sKey) {
      // if (skey) {
      //   var oItem = this._findItemByKey(skey);
      //   if(!!oItem){
      //     this._setMapElementSelection(oItem.item, oItem.isSpot);
      //   }
      // } else {
      //   this.resetMapPositionAndZoom();
      // }
      // if(!sKey){this.resetMapPositionAndZoom();}
    },

    onMarkerClick: function (oEvent) {
      this._setMapElementSelection(oEvent.getSource(), true);
    },

    setMakerPosition : function(sKey){

    },

    //  MAP ACTIONS

    resetMapPositionAndZoom: function () {
      this.oGeoMap.setCenterPosition(sDefaultCenterPostion);
      this.oGeoMap.setZoomlevel(iDefaultZoom);
    },

    attachClickMap : function(oData, fnFunction, oListeners){
      this.oGeoMap.attachClick($.extend(true, {}, oData, {callback:fnFunction}), this._fnClickMapEventHandler, oListeners);
    },

    _fnClickMapEventHandler : function(oEvent, oData){
      "use strict";
      var aPosition = oEvent.getParameter("pos").split(";");
      oData.callback.apply(this, [{
        position : [parseFloat(aPosition[0]), parseFloat(aPosition[1])]
      }]);
    },

    detachClickMap : function(fnFunction, oListeners){
      this.oGeoMap.detachClick(this._fnClickMapEventHandler, oListeners);
    }
  };
});
