"use strict";

var fs = require('fs');
class PrefabCreator {

    constructor(prefabName, prefabUrl, jsonFile, spriteMap) {
        this.prefabName = prefabName;
        this.prefabUrl = prefabUrl;
        this.jsonFile = jsonFile;
        this.spriteMap = spriteMap;
    }

    async createPrefabAsync() {
        try {
            var str = fs.readFileSync(this.jsonFile);
            var json = JSON.parse(str);

            var go = await this.createRoot(this.prefabName, json);
            // Editor.log(1, go);
            var prefab = new cc.Prefab();
            prefab.data = go;
            var prefabPath = this.prefabUrl + '/' + this.prefabName + '.prefab';
            var serializedPrefab = Editor.serialize(prefab);
            Editor.Ipc.sendToMain("scene:create-prefab", prefabPath, serializedPrefab, (e, t) => {
                if (e)
                    return cc.error(e);
                Editor.log('创建成功');
                Editor.Ipc.sendToPanel('auto_create_prefab', 'state', '创建成功');
            });
        } catch (e) {
            Editor.log(e);
        }
    }

    async ccLoaderLoadAsync(uuid) {
        return new Promise(function (resolve, reject) {
            cc.assetManager.loadAny({ uuid: uuid }, (e, f) => {
                if (e != null) {
                    Editor.log(e);
                    reject(null);
                }
                resolve(f);
            });
        });
    }

    async getSprite(name) {
        var uuid = this.spriteMap[name];
        var a = await this.ccLoaderLoadAsync(uuid);
        // Editor.log(1,a);
        return a;
    }

    createNode(name) {
        try {
            var c = new cc.Node(name);
            return c;
        } catch (e) {
            Editor.log(e);
        }
    }

    async createSprite(d, parent) {
        // try {
        // Editor.log('createSprite start');
        var node = this.createNode(d.name);
        node.setPosition(d.x, d.y);
        var image = node.addComponent(cc.Sprite);
        var a = await this.getSprite(d.name);
        image.spriteFrame = a;
        let rect = a.getRect();
        if (d.w != rect.width || d.h != rect.height)
            image.type = cc.Sprite.Type.SLICED;
        else
            image.type = cc.Sprite.Type.SIMPLE;
        // Editor.log('createSprite end');
        node.parent = parent;
        // } catch (e) { Editor.log(e); }
    }

    createLabel(d, parent) {
        // try {
        // Editor.log('createLabel start');
        var node = this.createNode(d.name);
        node.setPosition(d.x, d.y);
        var text = node.addComponent(cc.Label);
        text.string = d.text;
        text.verticalAlign = cc.Label.VerticalAlign.CENTER;
        text.overflow = cc.Label.Overflow.NONE;
        text.fontSize = d.size;
        var c = cc.color();
        c.fromHEX("#" + d.textColor);
        node.color = c;
        if (d.outline != '') {
            var outline = node.addComponent(cc.LabelOutline);
            outline.color = d.outline.color;
            outline.width = d.outline.size;
        }
        node.parent = parent;
        // Editor.log('createLabel end');
        // } catch (e) { Editor.log(e); }
    }

    async createRoot(name, json) {
        Editor.log('开始创建节点');
        var root = this.createNode(name);
        root.setContentSize(json.width, json.height);
        root.setPosition(0, 0);
        for (var i = 0, n = json.nodes.length; i < n; i++) {
            var item = json.nodes[i];
            switch (item.type) {
                case 'sprite':
                    await this.createSprite(item, root);
                    break;
                case 'label':
                    this.createLabel(item, root);
                    break;
            }
        }

        root.children.reverse();
        return root;
    }
}

exports.PrefabCreator = PrefabCreator;