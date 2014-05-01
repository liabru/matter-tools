// exports

MatterTools.Gui = Gui;
MatterTools.Inspector = Inspector;

// CommonJS module
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = MatterTools;
    }
    exports.MatterTools = MatterTools;
}

// AMD module
if (typeof define === 'function' && define.amd) {
    define('MatterTools', [], function () {
        return MatterTools;
    });
}

// browser
if (typeof window === 'object' && typeof window.document === 'object') {
    window.MatterTools = MatterTools;
}

// End MatterTools namespace closure

})();