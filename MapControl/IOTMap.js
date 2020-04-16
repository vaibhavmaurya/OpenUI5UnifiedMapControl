sap.ui.define(
    [
        "sap/ui/core/Control",
        "./MapLib/GoogleLayer",
        "./MapLib/VBILayer",
        "./IOTGoogleElement"
    ],
    function (Control, GoogleLayer, VBILayer, IOTGoogleElement) {
        "use strict";
        var sGoogle = 'google';
        var oMapLoadPromise = $.Deferred();
        var bMapLoaded = false;

        return Control.extend("com.sap.iot.locations_ui.MapControl.IOTMap", {
            oMapLayer : null,
            oMapElements : {
                instance : null
            },
            metadata: {
                properties: {
                    mapProvider: {
                        type: "object",
                        group: "Misc",
                        defaultValue: null
                    },
                    selectedMapElementKey: {
                        type: "string",
                        group: "MapElements",
                        defaultValue: null
                    },
                    
                    zoomByKey: {
                        type: "string",
                        group: "MapElements",
                        defaultValue: null
                    },

                    enableCreateMarkerOnClick : {
                        type: "boolean",
                        group: "MapElements",
                        defaultValue: false
                    },
                    markerData : { type: "object", defaultValue: null, bindable :false},
                    polygonData : { type: "object", defaultValue: null, bindable :false}
                },
                aggregations: {
                    mapContainer: { type: "sap.ui.core.Control", multiple: false, bindable: false },
                    googleMarker: { type: "MapControl.controller.IOTGoogleElement", multiple: true, bindable: true },
                    googlePolygon: { type: "MapControl.controller.IOTGoogleElement", multiple: true, bindable: true },
                },

                events: {
                    markerPress : {},
                    markerShiftStart : {},
                    markerShiftCompleted : {}
                    // clickMap : {}
                }
            },

            bMapLoaded : false,


            renderer: function (oRm, oControl) {
                oRm.write("<div");
                // oRm.write(' class="map-canvas" ');
                oRm.writeAttribute('fitContainer',true);
                // oRm.write(' fitContainer="true" ');
                oRm.writeControlData(oControl);
                oRm.writeClasses();
                oRm.write(">");
                if (oControl.getMapContainer()) {
                    oRm.renderControl(oControl.getMapContainer());
                }
                oRm.write("</div>");
            },

            // onExit : function(){
            //     var oMapProvider = this.getMapProvider();
            // },

            onAfterRendering : function(){
                var oMapProvider = this.getMapProvider();
                var bMapLoaded = false;
                if(oMapProvider && oMapProvider.MapProviderName === sGoogle){
                    bMapLoaded = this.oMapLayer.isMapInstanceAlive();
                    if(!bMapLoaded){
                        var oCloneDiv = $("#"+this.getId()).clone().attr("id",this.getId()+"-iotmap");
                        $("#"+this.getId()).append(oCloneDiv);
                        oMapLoadPromise = this.initMap(oMapProvider, this.getId()+"-iotmap");
                        oMapLoadPromise.done(function(){
                            bMapLoaded = true;
                            this.bMapLoaded = true;
                        }.bind(this));
                    }else{
                        var oMapElementsMap = this.oMapLayer.getMapInstance();
                        $('#'+this.getId()).append(oMapElementsMap.getDiv());
                    }
                }else if(oMapProvider && oMapProvider.MapProviderName !== sGoogle){
                    bMapLoaded = this.oMapLayer.isMapInstanceAlive();
                    if(!bMapLoaded){
                        oMapLoadPromise = this.initMap(oMapProvider, this.getId()+"-iotmap");
                        oMapLoadPromise.done(function(){
                            bMapLoaded = true;
                            this.bMapLoaded = true;
                            this.oMapLayer.bindSpots(this.getMarkerData(), $.proxy(this.fireMarkerPress,this));
                            this.oMapLayer.bindAreas(this.getPolygonData(), $.proxy(this.fireMarkerPress,this));
                        }.bind(this));                   
                    }else{
                        if(!this.getMapContainer()){
                            this.setMapContainer(this.oMapLayer.getMapInstance());
                        }
                    }
                }

                if(Control.prototype.onAfterRendering){
                    Control.prototype.onAfterRendering.apply(this, arguments);
                }
            },

            // onExit : function(){
            //     var oMapProvider = this.getMapProvider();
            //     if(oMapProvider && oMapProvider.MapProviderName === sGoogle){
            //         this.destroyGoogleMarkers();
            //         this.destroyGooglePolygons();
            //     }
            // },

            // Metadata propeties methods override

            setSelectedMapElementKey : function(sKey){
                oMapLoadPromise.done(function(){
                    this.oMapLayer && this.oMapLayer.setSelectedMapElement(sKey);
                }.bind(this));
                
                return this.setProperty("selectedMapElementKey",sKey, true);
            },

            setZoomByKey : function(sKey){

                oMapLoadPromise.done(function(){
                    this.oMapLayer && this.oMapLayer.zoomByKey(sKey);
                }.bind(this));                

                return this.setProperty("zoomByKey",sKey, true);
            },

            setMarkerData: function (o) {

                oMapLoadPromise.done(function(){
                    if (this._getMapProviderName() !== sGoogle) {
                        this.oMapLayer.bindSpots(o, $.proxy(this.fireMarkerPress,this));
                    } else {
                        var oTemplate = new IOTGoogleElement({ key: "{"+o.key+"}", geoPosition:"{"+o.pos+"}",googleLayer :GoogleLayer, isSpotElsePolygon:true});
                        this.bindAggregation("googleMarker", {
                            path: o.path,
                            template: oTemplate
                        });
                    }
                }.bind(this));
                
                return this.setProperty("markerData",o);
            },

            setPolygonData: function (o) {

                oMapLoadPromise.done(function(){
                    if (this._getMapProviderName() !== sGoogle) {
                        this.oMapLayer.bindAreas(o, $.proxy(this.fireMarkerPress,this));
                    } else {
                        var oTemplate = new IOTGoogleElement({ key: "{"+o.key+"}", geoPosition:"{"+o.pos+"}",googleLayer :GoogleLayer, isSpotElsePolygon:false});
                        this.bindAggregation("googlePolygon", {
                            path: o.path,
                            template: oTemplate
                        });
                    }
                }.bind(this));
                return this.setProperty("polygonData",o);
            },

            checkHere: function(val){
                return val;
            },

            setMapProvider: function (oVal) {
                if (!oVal) return;
                this.oMapLayer = oVal.MapProviderName === sGoogle ? GoogleLayer : VBILayer;
                return this.setProperty("mapProvider", oVal, true);
            },

            setEnableCreateMarkerOnClick : function(b){
                var bCurrent = this.getEnableCreateMarkerOnClick();
                if(bCurrent && (bCurrent !== b)){

                }
                return this.setProperty("enableCreateMarkerOnClick", sVal, true);
            },

                // metadata events override
            attachClickMap : function(oData, fnFunction, oListeners){
                oMapLoadPromise.done(function(){
                    this.oMapLayer.attachClickMap(oData, 
                        fnFunction,
                        oListeners,
                        this.getEnableCreateMarkerOnClick());
                }.bind(this));             
            },

            detachClickMap : function(fnFunction, oListeners){
                this.oMapLayer.detachClickMap(fnFunction, oListeners);               
            },            
            // Methods to be consumed externally not part of metadata


            // Aggregation methods override for MARKERS

            addGoogleMarker: function (oMarker) {
                "use strict";
                var oContext = oMarker.getBindingContext();
                var oData = oContext.getObject();
                this.oMapLayer.addGoogleMarkerForPosition(oData.key, oData.pos);
                this.addAggregation("googleMarker", oMarker, true);
                return this;
            },

            insertGoogleMarker: function (oMarker, iIndex) {
                "use strict";
                var oContext = oMarker.getBindingContext();
                var oData = oContext.getObject();
                this.oMapLayer.getGoogleMarkerForPosition(oData.pos);
                this.insertAggregation("googleMarker", oMarker, iIndex, true);
                return this;
            },

            indexOfGoogleMarker: function (o) {
                return this.indexOfAggregation("googleMarker", o);
            },

            removeGoogleMarker: function (oMarker) {
                this.oMapLayer.removeMarker(oMarker.getKey());
                this.removeAggregation("googleMarker", oMarker, true);
                if(oMarker && oMarker.destroy){
                    oMarker.destroy();
                }
                return this;
            },

            removeAllGoogleMarkers: function () {
                this.oMapLayer.removeAllMarkers();
                this.removeAllAggregation("googleMarker", true);
                return this;
            },

            destroyGoogleMarkers: function () {
                this.oMapLayer.removeAllMarkers();
                this.destroyAggregation("googleMarker", true);
                return this;
            },



            // Aggregation methods override for POLYGONS

            addGooglePolygon: function (oPolygon) {
                "use strict";
                var oContext = oPolygon.getBindingContext();
                var oData = oContext.getObject();
                this.oMapLayer.addGooglePolygonForPosition(oData.key, oData.pos);
                // oData.googlePolygon.addListener('click',function(){
                //     this.fireMarkerPress({
                //         data : oData,
                //         source : oData.googlePolygon
                //     });
                // }.bind(this));
                this.addAggregation("googlePolygon", oPolygon, true);
                return this;
            },

            insertGooglePolygon: function (oPolygon, iIndex) {
                "use strict";
                var oContext = oPolygon.getBindingContext();
                var oData = oContext.getObject();
                this.oMapLayer.addGooglePolygonForPosition(oData.pos);
                this.insertAggregation("googlePolygon", oPolygon, iIndex, true);
                return this;
            },

            indexOfGooglePolygon: function (o) {
                return this.indexOfAggregation("googlePolygon", o);
            },

            removeGooglePolygon: function (oPolygon) {
                this.oMapLayer.removePolygon(oPolygon.getKey());
                this.removeAggregation("googlePolygon", oPolygon, true);
                if(oPolygon && oPolygon.destroy){
                    oPolygon.destroy();
                }
                return this;
            },

            removeAllGooglePolygons: function () {
                this.oMapLayer.removeAllPolygon();
                this.removeAllAggregation("googlePolygon", true);
                return this;
            },

            destroyGooglePolygons: function () {
                this.oMapLayer.removeAllPolygon();
                this.destroyAggregation("googlePolygon", true);
                return this;
            },

            getPolygonByKey : function(sKey){
                var i=0;
                var aPolygons = this.getGooglePolygons();
                for(i=0;i<aPolygons.length;i+=1){
                    if(aPolygons[i].getKey() === sKey){
                        return aPolygons[i];
                    }
                }
                return null;
            },

            
            /////////////////////////////////////////////////////////////////////////////////////////

            _getMapProviderName : function(){
                return this.getMapProvider() ? this.getMapProvider().MapProviderName : null;
            },
            /* responsible for initialising the map */
            initMap: function (oMapProvider, sMapId) {
                // MapProviderName
                var oMapLoaded = oMapLoadPromise;
                var oMapElementsLocal = this.oMapElements;
                if (oMapProvider.MapProviderName === "google") {
                    this.oMapLayer.init(sMapId, oMapProvider.ApiKey).done(function(oMapElements){
                        oMapElementsLocal = oMapElements;
                        oMapLoaded.resolve();
                    }.bind(this));

                } else {
                    this.oMapLayer.init(oMapProvider).then(
                        function (oMap) {
                            this.oGeoMap = oMap;
                            this.setMapContainer(oMap);
                            oMapLoaded.resolve();
                        }.bind(this)
                    );
                }

                return oMapLoaded;
            }

        });
    }
);
