var f_img = "{\"type\":\"sprite\" ,\"name\":\"{name}\" , \"img\":\"{img}\" ,\"x\":\"{x}\" ,\"y\":\"{y}\",\"w\":\"{w}\" ,\"h\":\"{h}\"}";
var f_lbl = "{\"type\":\"label\" ,\"name\":\"{name}\" , \"text\":\"{text}\" ,\"x\":\"{x}\"  ,\"y\":\"{y}\",\"w\":\"{w}\" ,\"h\":\"{h}\", \"textColor\":\"#{color}\", \"size\":\"{size}\", \"bold\":\"{bold}\", \"italic\":\"{italic}\", \"direction\":\"{direction}\", \"justification\":\"{justification}\"}";
var f_ui = "{\"type\":\"{type}\" ,\"name\":\"{name}\" ,\"x\":\"{x}\" ,\"y\":\"{y}\",\"w\":\"{w}\" ,\"h\":\"{h}\", \"children\":\"{children}\"}";

if (!hasFilePath()) {
    alert("File did not save\nPlease save the file and try again");
} else {
    showExportDialog();
}

var onlyImg = false;
var usePNG8 = false;
var stageWidth;
var stageHeight;
var outputPath;
var qualityValue = 70;

function showExportDialog() {
    var dialog = new Window("dialog", "导出");
    var chk = dialog.add('checkbox');
    chk.text = '文字转图片';
    chk.checked = false;
    chk.onClick = function () {
        onlyImg = !onlyImg;
        // alert(onlyImg)
    };
    var chk1 = dialog.add('checkbox');
    chk1.text = '使用PNG8压缩';
    chk1.checked = false;
    chk1.onClick = function () {
        usePNG8 = !usePNG8;
    };
    dialog.add('statictext').text = '品质（1～100）';
    var quality = dialog.add('edittext');
    quality.text = '70';

    var okBtn = dialog.add('button');
    okBtn.text = '导出为...';
    okBtn.onClick = function () {
        qualityValue = Number(quality.text);
        var output = Folder.selectDialog('');
        if (output)
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
    outputPath = outPath;
    stageWidth = app.activeDocument.width.as("px").toFixed(0);
    stageHeight = app.activeDocument.height.as("px").toFixed(0);

    // var paths = outPath.split('/');
    // var name = paths[paths.length - 1];
    app.activeDocument.duplicate();
    if (onlyImg)
        app.activeDocument.rasterizeAllLayers();//栅格化
    var layers = [];
    for (var i = 0, l = app.activeDocument.layers.length; i < l; i++) {
        if (app.activeDocument.layers[i].visible) {
            layers.push(app.activeDocument.layers[i]);
            app.activeDocument.layers[i].visible = false;
        }
    }

    try {
        var layerCount = layers.length;
        for (var i = layerCount - 1; i >= 0; i--) {
            var layer = layers[i];
            layer.visible = true;
            createElementByLayer(layer);
            layer.visible = false;
        }
        activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    } catch (e) {
        alert(e)
    }
}

function createElementByLayer(root) {
    var name = root.name;
    name = name.replace(/ /g, '_').toLowerCase();
    var path = outputPath + '/' + name;
    checkFolder(path);
    var layers = [];
    getLayers(root, layers);
    var layerCount = layers.length;
    for (var i = layerCount - 1; i >= 0; i--) {
        var layer = layers[i];
        layer.visible = false;
    }
    var json = "{\"width\":" + stageWidth + ",\"height\":" + stageHeight + ",";
    json += "\"nodes\":[" + createElement(path + '/', layers) + "]}";

    var file = new File(path + '/' + name + ".json");
    file.remove();
    file.open("a");
    file.lineFeed = "Windows";
    file.encoding = "utf-8";
    file.write(json);
    file.close();
}

function checkFolder(path) {
    var folder = Folder(path)
    if (!folder.exists) folder.create()
}

function hasFilePath() {
    var reference = new ActionReference();
    reference.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    return executeActionGet(reference).hasKey(stringIDToTypeID("fileReference"));
}

function getLayers(root, collect) {
    if (!root.visible) return;
    if (!root.layers || root.layers.length == 0) {
        collect.push(root);
        return;
    }
    for (var i = 0, n = root.layers.length; i < n; i++) {
        var layer = root.layers[i];
        if (!layer.visible) continue;
        collect.push(layer);
    }
}

function trim(value) {
    return value.replace(/(\s)|(\.)|(\/)|(\\)|(\*)|(\:)|(\?)|(\")|(\<)|(\>)|(\|)/g, "_");
}

function getEnumValue(v) {
    return ('' + v + '').split('.')[1].toLowerCase();
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
    pngSaveOptions.PNG8 = !!usePNG8;
    pngSaveOptions.quality = qualityValue;
    app.activeDocument.saveAs(file, new PNGSaveOptions(), true, Extension.LOWERCASE);
    app.activeDocument.exportDocument(file, ExportType.SAVEFORWEB, pngSaveOptions);
}

function createImage(layer, dir) {
    var aaa = 1
    var bounds = formatBounds(layer.bounds);
    if (bounds[2] == 0 || bounds[3] == 0) return null;
    var doc = app.activeDocument;
    doc.trim(TrimType.TRANSPARENT, true, true, true, true);
    doc.activeLayer = layer;
    var name = trim(layer.name);
    if (name.indexOf('9_') == 0) {
        var a = name.split('_')[1].split(',');
        layer.rasterize(RasterizeType.ENTIRELAYER);
        var ccc = changeToSlice(a, bounds.w, bounds.h);
        aaa += ccc
    }
    saveImg(name, dir);
    if (name.indexOf('9_') == 0)
        stepHistoryBack(aaa);
    // alert(aaa);
    stepHistoryBack(1);
    // alert('b');
    return formatString(f_img, { 'name': name, img: name, x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h });
}

function createLabel(layer) {
    var textItem = layer.textItem;
    var bounds = formatBounds(layer.bounds);
    var name = trim(layer.name).substr(0, 5);
    var bold = false;
    var italic = false;
    try {
        bold = textItem.fauxBold;
    } catch (e) { }
    try {
        italic = textItem.fauxItalic;
    } catch (e) { }
    var contents = String(textItem.contents);
    return formatString(f_lbl, {
        'name': name,
        x: bounds.x,
        y: bounds.y,
        w: textItem.kind == TextType.PARAGRAPHTEXT ? textItem.width.as("px") : 0,
        h: textItem.kind == TextType.PARAGRAPHTEXT ? textItem.height.as("px") : 0,
        text: contents.replace(/\n/g, '\\n').replace(/\r/g, '\\n'),
        color: textItem.color.rgb.hexValue,
        size: textItem.size.as("px"),
        bold: bold,
        italic: italic,
        direction: getEnumValue(textItem.direction),
        justification: textItem.kind == TextType.PARAGRAPHTEXT ? getEnumValue(textItem.justification) : 'left'
    });
}

function createElement(dir, layers) {
    var elements = [];
    for (var i = layers.length - 1; i >= 0; i--) {
        var layer = layers[i];
        layer.visible = true;
        if (layer.layers && layer.layers.length > 0) {
            var e = createUI(dir, layer);
            if (e) elements[elements.length] = e;
        } else if (layer.kind == LayerKind.TEXT) {
            elements[elements.length] = createLabel(layer);
        } else {
            var e = createImage(layer, dir);
            if (e) elements[elements.length] = e;
        }
        layer.visible = false;
    }
    return elements.join(",");
}

function createUI(dir, layer) {
    if (layer.name.indexOf('#') == -1) {
        return createElement(dir, layer.layers);
    }
    var bounds = formatBounds(layer.bounds);
    var name = layer.name.split('#');
    return formatString(f_ui, { 'type': name[0], 'name': name[1], x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h, children: createElement(dir, layer.layers) });
}

function changeToSlice(a, w, h) {
    var ddd = 0

    var tempa = 1;
    var tempb = 1;

    //a:[top, left, bottom, right]裁切偏移
    var top = Number(a[0]),
        left = Number(a[1]),
        bottom = Number(a[2]),
        right = Number(a[3]);

    if (top + bottom == h) {
        tempa = 0;
    }
    if (left + right == w) {
        tempb = 0;
    }

    var doc = app.activeDocument;
    if (tempb != 0) {
        doc.selection.select([[left + tempb, 0], [w - right - tempb, 0], [w - right - tempb, h], [left + tempb, h]], SelectionType.REPLACE);
        doc.selection.clear();
        ddd = ddd + 2
    }

    // doc.selection.deselect();
    doc.selection.select([[w - right - tempb, 0], [w, 0], [w, h], [w - right - tempb, h]], SelectionType.REPLACE);
    ddd = ddd + 1
    w -= left + right + 2 * tempb;
    if (tempb != 0) {
        doc.selection.translate(UnitValue(-w + ' px'), 0);
        ddd = ddd + 1
    }
    // doc.selection.deselect();
    doc.trim(TrimType.TRANSPARENT, true, true, true, true);
    ddd = ddd + 1
    if (tempa != 0) {
        doc.selection.select([[0, top + tempa], [w, top + tempa], [w, h - bottom - tempa], [0, h - bottom - tempa]], SelectionType.REPLACE);
        doc.selection.clear();
        ddd = ddd + 2
    }

    // doc.selection.deselect();
    doc.selection.select([[0, h - bottom - tempa], [w, h - bottom - tempa], [w, h], [0, h]], SelectionType.REPLACE);
    ddd = ddd + 1
    h -= top + bottom + 2 * tempa;
    if (tempa != 0) {
        doc.selection.translate(0, UnitValue(-h + ' px'));
        ddd = ddd + 1
    }
    doc.selection.deselect();
    doc.trim(TrimType.TRANSPARENT, true, true, true, true);
    ddd = ddd + 2
    return ddd
}