
/*
  Generic  Canvas Layer for leaflet 0.7 and 1.0-rc, 
  copyright Stanislav Sumbera,  2016 , sumbera.com
  originally created and motivated by L.CanvasOverlay  available here: https://gist.github.com/Sumbera/11114288  

*/

L.CanvasLayer = L.Class.extend({
    // -- initialized is called on prototype 
    initialize: function (options) {
        this._map    = null;
        this._canvas = null;
        this._frame  = null;
        L.setOptions(this, options);
    },

    needRedraw: function () {
        if (!this._frame) {
            this._frame = L.Util.requestAnimFrame(this.drawLayer, this);
        }
        return this;
    },
    
    //-------------------------------------------------------------
    _onLayerDidResize: function (resizeEvent) {
        this._canvas.width = resizeEvent.newSize.x;
        this._canvas.height = resizeEvent.newSize.y;
    },
    //-------------------------------------------------------------
    _onLayerDidMove: function () {
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        this.drawLayer();
    },
    //-------------------------------------------------------------
    getEvents: function () {
        var events = {
            resize: this._onLayerDidResize,
            moveend: this._onLayerDidMove
        };
        if (this._map.options.zoomAnimation && L.Browser.any3d) {
            events.zoomanim =  this._animateZoom;
        }

        return events;
    },
    //-- Leaflet 1.0-rc compatibility  from L.Layer , extension  to get it worked on lf 1.0 rc, this is not called on <1.0 versions 
    _layerAdd: function (e) { this.onAdd(e.target); },
    //-------------------------------------------------------------
    onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-layer');
        this.tiles = {};

        var size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;

        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));


        map._panes.overlayPane.appendChild(this._canvas);

        map.on(this.getEvents(),this);
        

        this.onLayerDidMount && this.onLayerDidMount(); // -- callback
    },
    
    //-------------------------------------------------------------
    onRemove: function (map) {
        this.onLayerWillUnmount && this.onLayerWillUnmount(); // -- callback

        map.getPanes().overlayPane.removeChild(this._canvas);
 
        map.off(this.getEvents(),this);
        
        this._canvas = null;

    },

    //------------------------------------------------------------
    addTo: function (map) {
        map.addLayer(this);
        return this;
    },
    // --------------------------------------------------------------------------------
    LatLonToMercator: function (latlon) {
        return {
            x: latlon.lng * 6378137 * Math.PI / 180,
            y: Math.log(Math.tan((90 + latlon.lat) * Math.PI / 360)) * 6378137
        };
    },

    //------------------------------------------------------------------------------
    drawLayer: function () {
        // -- todo make the viewInfo properties  flat objects.
        var size   = this._map.getSize();
        var bounds = this._map.getBounds();
        var zoom   = this._map.getZoom();

        var center = this.LatLonToMercator(this._map.getCenter());
        var corner = this.LatLonToMercator(this._map.containerPointToLatLng(this._map.getSize()));
                        
        this.onDrawLayer && this.onDrawLayer({  canvas: this._canvas,
                                                bounds: bounds,
                                                size: size,
                                                zoom: zoom,
                                                center : center,
                                                corner : corner
                                            });
        this._frame = null;
    },

    //------------------------------------------------------------------------------
    _animateZoom: function (e) {
        var scale = this._map.getZoomScale(e.zoom),
            offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

        this._canvas.style[L.DomUtil.TRANSFORM] = (L.Browser.ie3d ? 'translate(' + offset.x + 'px,' + offset.y + 'px)' :
                                                                 'translate3d(' + offset.x + 'px,' + offset.y + 'px,0)') +
                                                                 (scale ? ' scale(' + scale + ')' : '');

    }
});

L.canvasLayer = function () {
    return new L.CanvasLayer();
};


