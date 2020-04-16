sap.ui.define(
    [
        "sap/ui/core/CustomData"
    ],
    function (CustomData) {
        "use strict";
        return CustomData.extend("MapControl.controller.IOTGoogleElement", {
            metadata: {
                properties: {
                    googleLayer: {
                        type: "object",
                        group: "Base",
                        defaultValue: null
                    },
                    geoPosition: {
                        type: "object",
                        group: "GeoPositions",
                        defaultValue: null,
                        bindable:true
                    },
                    isSpotElsePolygon: {
                        type: "boolean",
                        group: "Base",
                        defaultValue: false
                    }                 
                },
                
                events: {

                }
            },

            setKey : function(sVal){
                if(this.getKey() === "New"){
                    var oGoogleLayer = this.getGoogleLayer();
                    oGoogleLayer.updateKey(this.getIsSpotElsePolygon(),this.getKey(),sVal);                    
                }
                return this.setProperty("key",sVal,true);
            },

            setGeoPosition : function(aVal){
                var oGoogleLayer = this.getGoogleLayer();
                var sMethod = this.getIsSpotElsePolygon() ? 'setMarkerPosition':'setPolygonPosition';
                if(oGoogleLayer){
                    oGoogleLayer[sMethod](this.getKey(), aVal);
                }
                return this.setProperty("geoPosition",aVal,true);
            }

            // renderer: {}
        });
    }
);
