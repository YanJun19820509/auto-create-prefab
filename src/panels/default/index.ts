import { readFileSync } from 'fs-extra';
import { join, basename } from 'path';
import { createApp, App } from 'vue';
const weakMap = new WeakMap<any, App>();
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    listeners: {
        // show() { console.log('show'); },
        // hide() { console.log('hide'); },
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app'
    },
    methods: {
        setState(v: string) {
            console.log(v);
        }
    },
    ready() {
        if (this.$.app) {
            const app = createApp({});
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            app.component('my-info', {
                template: readFileSync(join(__dirname, '../../../static/template/vue/info.html'), 'utf-8'),
                data() {
                    return {
                        name: '',
                        prefabFolder: '',
                        psdOutput: '',
                        onlyAtlas: false,
                        isP2: false,
                        defaultOnlyAtlas: false,
                        defaultIsP2: false
                    };
                }, methods: {
                    async openPrefab() {
                        this.prefabFolder = await this.openFolder(join(Editor.Project.path, './assets', this.prefabFolder));
                        // this.saveInfo('prefabFolder', this.prefabFolder);
                    },
                    async openPsd() {
                        this.psdOutput = await this.openFolder(this.psdOutput == '' ? '.' : this.psdOutput);
                        this.name = basename(this.psdOutput);
                    },
                    async download() {
                        let path = await this.openFolder(Editor.Utils.Url.getDocUrl('.'));
                        Editor.Message.send('auto-create-prefab', 'downloadJSX', path);
                    },
                    checkOnlyAtlas: function () {
                        this.defaultOnlyAtlas = !this.defaultOnlyAtlas;
                        this.onlyAtlas = this.defaultOnlyAtlas;
                    },
                    checkIsP2: function () {
                        this.defaultIsP2 = !this.defaultIsP2;
                        this.isP2 = this.defaultIsP2;
                    },
                    ok() {
                        if (this.name == '') {
                            alert('请输入创建prefab的名称！')
                            return;
                        }
                        if (this.prefabFolder == '') {
                            alert('请选择创建prefab的目录！')
                            return;
                        }
                        if (this.psdOutput == '') {
                            alert('请选择psd导出文件夹！')
                            return;
                        }

                        Editor.Message.send('auto-create-prefab', 'ok', JSON.stringify({
                            name: this.name,
                            input: this.psdOutput,
                            output: this.prefabFolder,
                            onlyAtlas: this.onlyAtlas,
                            isP2: this.isP2
                        }));
                    },
                    async openFolder(basePath: string) {
                        var result = await Editor.Dialog.select({
                            path: basePath,
                            type: 'directory'
                        });
                        let a = result.filePaths[0];
                        if (!a) return '';
                        return a;
                    }
                }
            });
            app.mount(this.$.app);
            weakMap.set(this, app);
        }
    },
    beforeClose() { },
    close() {
        const app = weakMap.get(this);
        if (app) {
            app.unmount();
        }
    },
});
