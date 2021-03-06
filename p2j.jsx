var f_img = "{\"type\":\"sprite\" ,\"name\":\"{name}\" , \"img\":\"{img}\" ,\"x\":{x} ,\"y\":{y},\"w\":{w} ,\"h\":{h} ,\"9\":{9}}";
var f_lbl = "{\"type\":\"label\" ,\"name\":\"{name}\" , \"text\":\"{text}\" ,\"x\":{x}  ,\"y\":{y},\"w\":{w} ,\"h\":{h}, \"textColor\":\"#{color}\", \"size\":{size}, \"bold\":{bold}, \"italic\":{italic}, \"direction\":\"{direction}\", \"justification\":\"{justification}\",\"outline\":\"{outline}\",\"shadow\":\"{shadow}\"}";
var f_ui = "{\"type\":\"{type}\" ,\"name\":\"{name}\" ,\"x\":{x} ,\"y\":{y},\"w\":{w} ,\"h\":{h}, \"children\":[{children}]}";

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

    var layers = getVisibleLayer(app.activeDocument);

    try {
        for (var i = layers.length - 1; i >= 0; i--) {
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

function getVisibleLayer(root) {
    var a = [];
    if (root.hasOwnProperty("visible") && !root.visible) return a;
    var layers = root.layers;
    if (!layers || layers.length == 0) {
        a.push(root);
    } else
        for (var i = 0, n = layers.length; i < n; i++) {
            if (layers[i].visible) {
                layers[i].visible = false;
                a[a.length] = layers[i];
            }
        }
    return a;
}

function createElementByLayer(root) {
    var name = root.name;
    name = name.replace(/ /g, '_').toLowerCase();
    var path = outputPath + '/' + name;
    checkFolder(path);
    var layers = getVisibleLayer(root);
    var json = "{\"width\":" + stageWidth + ",\"height\":" + stageHeight + ",";
    json += "\"nodes\":[" + createElement(path + '/', layers, null) + "]}";

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

function trim(value) {
    return value.replace(/\s/g, "_")
        .replace(/\//g, "_-1")
        .replace(/\\/g, "_-2")
        .replace(/\*/g, "_-3")
        .replace(/\:/g, "_-4")
        .replace(/\?/g, "_-5")
        .replace(/\"/g, "_-6")
        .replace(/\</g, "_-7")
        .replace(/\>/g, "_-8")
        .replace(/\|/g, "_-9");
}

function getEnumValue(v) {
    return ('' + v + '').split('.')[1].toLowerCase();
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

function createImage(layer, dir, parentBounds) {
    var aaa = 1
    var bounds = formatBounds(layer.bounds);
    if (bounds[2] == 0 || bounds[3] == 0) return null;
    var doc = app.activeDocument;
    doc.trim(TrimType.TRANSPARENT, true, true, true, true);
    doc.activeLayer = layer;
    var name = trim(layer.name);
    if (name.indexOf('_9_') > 0) {
        var aa = name.split('_9_');
        name = aa[0];
        layer.rasterize(RasterizeType.ENTIRELAYER);
        var bounds1 = formatBounds(layer.bounds);
        var ccc = changeToSlice(aa[1].split(','), bounds1.w, bounds1.h);
        aaa += ccc + 1;
    }
    saveImg(name, dir);
    // alert(aaa);
    stepHistoryBack(aaa);
    // alert('b');
    return formatString(f_img, {
        'name': name, img: name,
        x: bounds.x - (parentBounds ? parentBounds.x : 0),
        y: parentBounds ? parentBounds.y - bounds.y : bounds.y, w: bounds.w, h: bounds.h,
        '9': aaa > 1
    });
}

function createLabel(layer, parentBounds) {
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

    var doc = app.activeDocument;
    doc.activeLayer = layer;
    return formatString(f_lbl, {
        'name': name,
        x: bounds.x - (parentBounds ? parentBounds.x : 0),
        y: parentBounds ? parentBounds.y - bounds.y : bounds.y,
        w: textItem.kind == TextType.PARAGRAPHTEXT ? textItem.width.as("px") : 0,
        h: textItem.kind == TextType.PARAGRAPHTEXT ? textItem.height.as("px") : 0,
        text: contents.replace(/\n/g, '\\n').replace(/\r/g, '\\n'),
        color: textItem.color.rgb.hexValue,
        size: textItem.size.as("px"),
        bold: bold,
        italic: italic,
        direction: getEnumValue(textItem.direction),
        justification: textItem.kind == TextType.PARAGRAPHTEXT ? getEnumValue(textItem.justification) : 'left',
        outline: outlineInfo(),
        shadow: dropShadowInfo()
    });
}

function createElement(dir, layers, parentBounds) {
    var elements = [];
    for (var i = layers.length - 1; i >= 0; i--) {
        var layer = layers[i];
        layer.visible = true;
        if (layer.layers && layer.layers.length > 0) {
            var e = createUI(dir, layer, parentBounds);
            if (e) elements[elements.length] = e;
        } else if (layer.kind == LayerKind.TEXT) {
            elements[elements.length] = createLabel(layer, parentBounds);
        } else {
            var e = createImage(layer, dir, parentBounds);
            if (e) elements[elements.length] = e;
        }
        layer.visible = false;
    }
    return elements.join(",");
}

function createUI(dir, layer, parentBounds) {
    if (layer.name.indexOf('#') == -1) {
        return createElement(dir, getVisibleLayer(layer), parentBounds);
    }
    var bounds = formatBounds(layer.bounds);
    var name = layer.name.split('#');
    return formatString(f_ui, {
        'type': name[0], 'name': name[1],
        x: bounds.x - (parentBounds ? parentBounds.x : 0),
        y: parentBounds ? parentBounds.y - bounds.y : bounds.y, w: bounds.w, h: bounds.h, children: createElement(dir, getVisibleLayer(layer), bounds)
    });
}

function changeToSlice(a, w, h) {
    var ddd = 0

    var tempa = 1;
    var tempb = 1;

    //a:[top, left, bottom, right]裁切偏移
    var top = Number(a[0] || 20),
        left = Number(a[1] || 20),
        bottom = Number(a[2] || 20),
        right = Number(a[3] || 20);

    if (top + bottom == h) {
        tempa = 0;
    }
    if (left + right == w) {
        tempb = 0;
    }

    var doc = app.activeDocument;
    if (tempb != 0) {
        doc.selection.select([[left + tempb, 0], [w - right, 0], [w - right, h], [left + tempb, h]], SelectionType.REPLACE);
        doc.selection.clear();

        // doc.selection.deselect();
        doc.selection.select([[w - right, 0], [w, 0], [w, h], [w - right, h]], SelectionType.REPLACE);
        w -= left + right + tempb;

        doc.selection.translate(UnitValue(-w + ' px'), 0);
        // doc.selection.deselect();
        doc.trim(TrimType.TRANSPARENT, true, true, true, true);
        w = left + right + tempb;
        ddd += 5;
    }
    if (tempa != 0) {
        doc.selection.select([[0, top + tempa], [w, top + tempa], [w, h - bottom], [0, h - bottom]], SelectionType.REPLACE);
        doc.selection.clear();

        // doc.selection.deselect();
        doc.selection.select([[0, h - bottom], [w, h - bottom], [w, h], [0, h]], SelectionType.REPLACE);
        h -= top + bottom + tempa;
        doc.selection.translate(0, UnitValue(-h + ' px'));
        doc.trim(TrimType.TRANSPARENT, true, true, true, true);
        ddd += 5;
    }
    doc.selection.deselect();
    ddd++;
    return ddd;
}
function getID(str) {
    return app.stringIDToTypeID(str);
}

function getActiveLayerDescriptor() {
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    return executeActionGet(ref);
}

function descToColorList(colorDesc) {
    return rgbTxt = [roundColor(colorDesc.getDouble(1382293536)),
    roundColor(colorDesc.getDouble(1198681632)),
    roundColor(colorDesc.getDouble(1114382368))];
}

function changeToHex(rgbTxt) {
    var value = "";
    for (var i = 0, len = rgbTxt.length; i < len; i++) {
        var string = rgbTxt[i].toString(16);
        if (string.length < 2) {
            string = "0" + string;
        }
        value += string;
    }
    return value;
}

function roundColor(x) {
    x = Math.round(x);
    return (x > 255) ? 255 : x;
}


function outlineInfo() {
    var currentDesc = getActiveLayerDescriptor();
    var str = ''
    var layerEffectsID = getID("layerEffects");
    if (currentDesc.hasKey(layerEffectsID)) {
        var layerEffectsDesc = currentDesc.getObjectValue(layerEffectsID);
        var frameFXID = getID("frameFX");
        if (layerEffectsDesc.hasKey(frameFXID)) {
            var frameFXDesc = layerEffectsDesc.getObjectValue(frameFXID);
            var colorID = getID("color");
            if (frameFXDesc.hasKey(colorID) && frameFXDesc.getBoolean(getID("enabled"))) {
                var colorDesc = frameFXDesc.getObjectValue(colorID);
                var rgbTxt = descToColorList(colorDesc);
                var rgbHexTxt = '#' + changeToHex(rgbTxt);
                str = str + rgbHexTxt + '|'
            }
            var sizeid = getID("size");
            if (frameFXDesc.hasKey(sizeid) && frameFXDesc.getBoolean(getID("enabled"))) {
                var sizeDesc = frameFXDesc.getUnitDoubleValue(sizeid, "#Pxl");
                str = str + sizeDesc
            }
        }
    }
    return str;
}

/**
 * 
 * @returns color|distance|LightingAngle|blur
 */
function dropShadowInfo() {
    var currentDesc = getActiveLayerDescriptor();
    var str = ''
    var layerEffectsID = getID("layerEffects");
    if (currentDesc.hasKey(layerEffectsID)) {
        var layerEffectsDesc = currentDesc.getObjectValue(layerEffectsID);
        var dropShadowID = getID("dropShadow");
        if (layerEffectsDesc.hasKey(dropShadowID)) {
            var dropShadowDesc = layerEffectsDesc.getObjectValue(dropShadowID);
            var colorID = getID("color");
            if (dropShadowDesc.hasKey(colorID) && dropShadowDesc.getBoolean(getID("enabled"))) {
                var colorDesc = dropShadowDesc.getObjectValue(colorID);
                var rgbTxt = descToColorList(colorDesc);
                var rgbHexTxt = '#' + changeToHex(rgbTxt);
                str = str + rgbHexTxt + '|'
            }

            var distanceid = getID("distance");
            if (dropShadowDesc.hasKey(distanceid) && dropShadowDesc.getBoolean(getID("enabled"))) {
                var distanceDesc = dropShadowDesc.getUnitDoubleValue(distanceid);
                str = str + distanceDesc + '|'
            }

            var angleid = getID("localLightingAngle");
            if (dropShadowDesc.hasKey(angleid) && dropShadowDesc.getBoolean(getID("enabled"))) {
                var angleDesc = dropShadowDesc.getUnitDoubleValue(angleid);
                str = str + angleDesc + '|'
            }

            var blurid = getID("blur");
            if (dropShadowDesc.hasKey(blurid) && dropShadowDesc.getBoolean(getID("enabled"))) {
                var blurDesc = dropShadowDesc.getUnitDoubleValue(blurid);
                str = str + blurDesc
            }
        }
    }
    return str;
}