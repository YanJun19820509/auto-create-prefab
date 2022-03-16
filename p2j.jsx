var f_img = "{\"type\":\"sprite\" ,\"name\":\"{name}\" , \"img\":\"{img}\" ,\"x\":\"{x}\" ,\"y\":\"{y}\",\"w\":\"{w}\" ,\"h\":\"{h}\"}\n";
var f_lbl = "{\"type\":\"label\" ,\"name\":\"{name}\" , \"text\":\"{text}\" ,\"x\":\"{x}\"  ,\"y\":\"{y}\", \"textColor\":\"#{color}\", \"size\":\"{size}\", \"bold\":\"{bold}\", \"italic\":\"{italic}\"}\n";

if (!hasFilePath()) {
    alert("File did not save\nPlease save the file and try again");
} else {
    showExportDialog();
}

var onlyImg = false;

function showExportDialog() {
    var dialog = new Window("dialog", "导出");
    var chk = dialog.add('checkbox');
    chk.text = '文字转图片';
    chk.checked = false;
    chk.onClick = function () {
        onlyImg = !onlyImg;
        // alert(onlyImg)
    };
    var okBtn = dialog.add('button');
    okBtn.text = '导出为...';
    okBtn.onClick = function () {
        var output = Folder.selectDialog('');
        init(output + '');
        this.parent.close(0);
    };
    var cancelBtn = dialog.add('button');
    cancelBtn.text = '取消';
    cancelBtn.onClick = function () {
        this.parent.close(0);
    };
    dialog.center();
    dialog.show();
}

function init(outPath) {

    var stageWidth = app.activeDocument.width.as("px").toFixed(0);
    var stageHeight = app.activeDocument.height.as("px").toFixed(0);

    var paths = outPath.split('/');
    var name = paths[paths.length - 1];
    app.activeDocument.duplicate();
    if (onlyImg)
        app.activeDocument.rasterizeAllLayers();//栅格化
    var layers = [];
    for (var i = 0, l = app.activeDocument.layers.length; i < l; i++) {
        if (app.activeDocument.layers[i].visible) {
            getLayers(app.activeDocument.layers[i], layers);
        }
    }

    var layerCount = layers.length;
    for (var i = layerCount - 1; i >= 0; i--) {
        var layer = layers[i];
        layer.visible = false;
    }
    var json = "{\"width\":" + stageWidth + ",\"height\":" + stageHeight + ",";
    json += "\"nodes\":[" + createElement(outPath + '/', layers) + "]";
    json += "}";

    var file = new File(outPath + '/' + name + ".json");
    file.remove();
    file.open("a");
    file.lineFeed = "\n";
    file.encoding = "utf-8";
    file.write(json);
    file.close();
    activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}

function hasFilePath() {
    var reference = new ActionReference();
    reference.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    return executeActionGet(reference).hasKey(stringIDToTypeID("fileReference"));
}

function getLayers(layer, collect) {
    if (!layer.layers || layer.layers.length == 0) {
        if (!layer.visible) return null;
        return layer;
    }
    for (var i = 0, n = layer.layers.length; i < n; i++) {
        var child = getLayers(layer.layers[i], collect)
        if (child) collect.push(child);
    }
}

function trim(value) {
    return value.replace(/(\s)|(\.)|(\/)|(\\)|(\*)|(\:)|(\?)|(\")|(\<)|(\>)|(\|)/g, "_");
}

function getLayerVisible(layer) {
    var bool = layer.visible;
    var obj = layer;
    while (obj.parent && obj.parent.hasOwnProperty("visible")) {
        if (obj.parent.visible == false) {
            bool = false;
        }
        obj = obj.parent;
    }
    alert(bool)
    return bool;
}

function stepHistoryBack(n) {
    var descriptor = new ActionDescriptor();
    var reference = new ActionReference();
    reference.putEnumerated(charIDToTypeID("HstS"), charIDToTypeID("Ordn"), charIDToTypeID("Prvs"));
    descriptor.putReference(charIDToTypeID("null"), reference);
    for (var i = n; i > 0; i--)
        executeAction(charIDToTypeID("slct"), descriptor, DialogModes.NO);
}

function formatBounds(bounds) {
    var left = Number(bounds[0].as("px").toFixed(0)),
        top = Number(bounds[1].as("px").toFixed(0)),
        right = Number(bounds[2].as("px").toFixed(0)),
        bottom = Number(bounds[3].as("px").toFixed(0)),
        w = Math.floor(right - left),
        h = Math.floor(bottom - top);
    return { 'x': left + w / 2, 'y': top + h / 2, 'w': w, 'h': h };
}

function formatString(formatter, d) {
    var result = formatter;
    for (var k in d) {
        var regx = new RegExp("\\{" + k + "\\}", "g");
        result = result.replace(regx, d[k]);
    }
    return result;
}

function saveImg(name, dir) {
    var file = File(dir + name + '.png');
    if (file.exists) file.remove();
    var pngSaveOptions = new ExportOptionsSaveForWeb();
    pngSaveOptions.format = SaveDocumentType.PNG;
    pngSaveOptions.transparency = true;
    pngSaveOptions.includeProfile = false;
    pngSaveOptions.interlaced = true;
    pngSaveOptions.PNG8 = true;
    app.activeDocument.saveAs(file, new PNGSaveOptions(), true, Extension.LOWERCASE);
    app.activeDocument.exportDocument(file, ExportType.SAVEFORWEB, pngSaveOptions);
}

function createImage(layer, dir) {
    // alert('a');
    var bounds = formatBounds(layer.bounds);
    var doc = app.activeDocument;
    if (!layer.isBackgroundLayer) {
        doc.trim(TrimType.TRANSPARENT, true, true, true, true);
    }
    doc.activeLayer = layer;
    var name = trim(layer.name);
    if (name.indexOf('9_') == 0) {
        var a = name.split('_')[1].split(',');
        layer.rasterize(RasterizeType.ENTIRELAYER);
        changeToSlice(a, bounds.w, bounds.h);
    }
    saveImg(name, dir);
    if (name.indexOf('9_') == 0)
        stepHistoryBack(12);
    // alert('b');
    if (!layer.isBackgroundLayer) {
        if (bounds[2] != 0 && bounds[3] != 0) {
            stepHistoryBack(1);
        }
    }
    // doc.close(SaveOptions.DONOTSAVECHANGES);
    return formatString(f_img, { 'name': name, img: name, x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h });
}

function createLabel(layer) {
    var textItem = layer.textItem;
    // for (var key in textItem) {
    //     alert(key);
    // }
    var bounds = formatBounds(layer.bounds);
    var name = trim(layer.name);
    return formatString(f_lbl, { 'name': name, x: bounds.x, y: bounds.y, text: textItem.contents, color: textItem.color.rgb.hexValue, size: textItem.size.as("px"), bold: textItem.fauxBold, italic: textItem.fauxItalic });
}

function createElement(dir, layers) {
    // var doc = app.activeDocument;
    // var layers;
    // if (doc.layerSets && doc.layerSets[0] != null)
    //     layers = doc.layerSets[0].artLayers;
    // else layers = doc.artLayers;
    var elements = [];
    for (var i = layers.length - 1; i >= 0; i--) {
        var layer = layers[i];
        layer.visible = true;
        // alert(layer.kind);
        if (layer.kind == LayerKind.TEXT) {
            elements[elements.length] = createLabel(layer);
        } else {
            elements[elements.length] = createImage(layer, dir);
        }
        layer.visible = false;
    }
    return elements.join(",");
}

function changeToSlice(a, w, h) {
    //a:[top, left, bottom, right]裁切偏移
    var top = Number(a[0]),
        left = Number(a[1]),
        bottom = Number(a[2]),
        right = Number(a[3]);
    var doc = app.activeDocument;
    doc.selection.select([[left + 1, 0], [w - right - 1, 0], [w - right - 1, h], [left + 1, h]], SelectionType.REPLACE);
    doc.selection.clear();
    // doc.selection.deselect();
    doc.selection.select([[w - right - 1, 0], [w, 0], [w, h], [w - right - 1, h]], SelectionType.REPLACE);
    w -= left + right + 2;
    doc.selection.translate(UnitValue(-w + ' px'), 0);
    // doc.selection.deselect();
    doc.trim(TrimType.TRANSPARENT, true, true, true, true);
    doc.selection.select([[0, top + 1], [w, top + 1], [w, h - bottom - 1], [0, h - bottom - 1]], SelectionType.REPLACE);
    doc.selection.clear();
    // doc.selection.deselect();
    doc.selection.select([[0, h - bottom - 1], [w, h - bottom - 1], [w, h], [0, h]], SelectionType.REPLACE);
    h -= top + bottom + 2;
    doc.selection.translate(0, UnitValue(-h + ' px'));
    doc.selection.deselect();
    doc.trim(TrimType.TRANSPARENT, true, true, true, true);
}