sap.ui.define([], function () {
  "use strict";
  var oGoogleMarkers = {};
  var oGooglePolygons = {};
  return {
    mapData: {
      create: {
        marker: "",
        polygon: []
      }
    },

    isMapInstanceAlive : function(){
        return this.mapLib && this.mapLib.instance;
    },

    init: function (mapId, sKey) {
      var superSelf = this;
      return $.Deferred(function () {
        var self = this;
        if (!jQuery().cycle) {
          jQuery.getScript(
            "https://maps.googleapis.com/maps/api/js?key="+sKey,
            function () {
              var googleInstance = new google.maps.Map(
                document.getElementById(mapId),
                {
                  center: new google.maps.LatLng(0, 0),
                  zoom: 3,
                  minZoom: 1,
                  zoomControl: true,
                  scaleControl: false,
                  rotateControl: false,
                  fullscreenControl : false,
                  streetViewControl : false,
                  mapTypeControl : false 
                }
              );
              googleInstance.setOptions({ draggableCursor: "" });
              superSelf.mapLib = { 
                                    instance: googleInstance,
                                    googleAPI: google,
                                    defaultCenter :  new google.maps.LatLng(0, 0),
                                    defaultZoom : 3
                                  };
              self.resolve(superSelf.mapLib);
            }
          );
        }
      });
    },

    // common function

    getMapInstance : function(){
      return this.mapLib.instance;
    },

    updateKey : function(bMarker, sCurrentKey, sNewKey){
      var oContext = bMarker ? oGoogleMarkers : oGooglePolygons;
      oContext[sNewKey] = oContext[sCurrentKey];
      delete oContext[sCurrentKey];
    },

    // FOR MARKERS

    addGoogleMarkerForPosition: function (sKey, aCoords) {
      var oMapElement = this.mapLib;
      oGoogleMarkers[sKey] = this._getMarkerForPosition(aCoords);
      return oGoogleMarkers[sKey];
    },

    clearMapForElement: function (oElement) {
      oElement.setMap(null);
    },

    removeMarker: function(sKey){
      this.clearMapForElement(oGoogleMarkers[sKey]);
      delete oGoogleMarkers[sKey];
    },

    setMarkerPosition: function (sKey, aVal) {
      var oMapElement = this.mapLib;
      if(oGoogleMarkers[sKey]){
        oGoogleMarkers[sKey].setPosition(new oMapElement.googleAPI.maps.LatLng(parseFloat(aVal[1]), parseFloat(aVal[0])));
      }
    },

    _getMarkerForPosition : function(aCoords){
      var oMapElement = this.mapLib;
      return new oMapElement.googleAPI.maps.Marker({
        position: new oMapElement.googleAPI.maps.LatLng(parseFloat(aCoords[1]), parseFloat(aCoords[0])),
        map: oMapElement.instance
      });
    },

    removeAllMarkers : function(){
      // clearMapForElement
            for(var x in oGoogleMarkers){
              if(oGoogleMarkers.hasOwnProperty(x)){
                this.clearMapForElement(x);
                delete oGoogleMarkers[x];
              }
            }
    },

// MAKER ACTIONS

    setSelectedMapElement : function(sKey){
      // if(sKey){
      //   var oItem = this._findItemByKey(sKey);
      //   if(!!oItem){
      //     this._setMapElementSelection(oItem.item, oItem.isSpot);
      //   }
        
      // }else{
      //   this.resetMapPositionAndZoom();
      // }
      // if(!sKey){this.resetMapPositionAndZoom();}
    },

    _findItemByKey : function(sKey){
      if(!sKey) {return null;}
      var oContext = oGoogleMarkers[sKey] ? oGoogleMarkers : oGooglePolygons;
      var isSpot = oGoogleMarkers[sKey] ? true : false;
      return oContext[sKey]? {item:oContext[sKey],isSpot:isSpot} : null;
    },

    zoomByKey : function(sKey){
      var oItem = this._findItemByKey(sKey);
      if(!!oItem){
        this._setMapElementSelection(oItem.item, oItem.isSpot);
      }else{
        this.resetMapPositionAndZoom();
      }
    },

    _setMapElementSelection : function(oElement, isSpot){
      var oMapElement = this.mapLib;
      if(isSpot){
        oMapElement.instance.setZoom(8);
        oMapElement.instance.panTo(oElement.getPosition());
      }else{
        var bounds = new oMapElement.googleAPI.maps.LatLngBounds();
        var path, paths;
        oMapElement.instance.fitBounds(function() {
            var bounds = new oMapElement.googleAPI.maps.LatLngBounds();
            var paths = this.getPaths();
            var path;        
            for (var i = 0; i < paths.getLength(); i++) {
                path = paths.getAt(i);
                for (var ii = 0; ii < path.getLength(); ii++) {
                    bounds.extend(path.getAt(ii));
                }
            }
            return bounds;
        }.bind(oElement)());
      }
    },    

    onMarkerClick : function(oMarker){
      this._setMapElementSelection(oMarker);
    },

//  MAP ACTIONS
    resetMapPositionAndZoom : function(){
      var oMapElement = this.mapLib;
      oMapElement.instance.setZoom(oMapElement.defaultZoom);
      oMapElement.instance.setCenter(oMapElement.defaultCenter);
    },

    attachClickMap : function(oData, fnFunction, oListeners, bCreateMarkerOnClick){
      var map = this.mapLib.instance;
      map.addListener('click', function(e) {
        // placeMarkerAndPanTo(e.latLng, map);
        "use strict";
        if(bCreateMarkerOnClick){
          oTempMarker = this._getMarkerForPosition([e.latLng.lng(), e.latLng.lat()]);
        }
        if(fnFunction){
          fnFunction.apply(oListeners,[{
            position : [e.latLng.lng(), e.latLng.lat()]
          }]);
        }
      }.bind(this));
    },

    detachClickMap : function(fnFunction, oListeners){
      if(!this.mapLib || !this.mapLib.instance){return;}
      var map = this.mapLib.instance;
      var oGoogleAPI = this.mapLib.googleAPI;
      oGoogleAPI.maps.event.clearListeners(map, 'click');
    },


    // FOR POLYGONS

    addGooglePolygonForPosition: function (sKey, aCoords) {
      var oMapElement = this.mapLib;
      oGooglePolygons[sKey] = new oMapElement.googleAPI.maps.Polygon({
        paths: this._convertToPolygonCoords(aCoords),
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: oMapElement.instance
      });
      return oGooglePolygons[sKey];
    },

    _convertToPolygonCoords : function(aVal){
      return aVal[0].map(function(a){
        return {lat:a[1],lng:a[0]};
      });
    },
    
    
    setPolygonPosition: function (sKey, aVal) {
      var aCoords = this._convertToPolygonCoords(aVal);
      if(oGooglePolygons[sKey]){
        oGooglePolygons[sKey].setPaths(aCoords);
      }
    },  
    
    removePolygon: function(sKey){
      this.clearMapForElement(oGooglePolygons[sKey]);
      delete oGooglePolygons[sKey];
    },

    removeAllPolygon : function(){
// clearMapForElement
      for(var x in oGooglePolygons){
        if(oGooglePolygons.hasOwnProperty(x)){
          this.clearMapForElement(x);
          delete oGooglePolygons[x];
        }
      }
    }
       
  };
});
