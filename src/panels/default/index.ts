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
                        imgFolder: '',
                        imgRootFolder: '',
                        psdOutput: '',
                        onlyAtlas: true,
                        canRotate: true
                    };
                }, methods: {
                    async openPrefab() {
                        this.prefabFolder = await this.openFolder(join(Editor.Project.path, './assets', this.prefabFolder));
                        // this.saveInfo('prefabFolder', this.prefabFolder);
                    },
                    // async openTexture() {
                    //     this.imgFolder = await this.openFolder(Editor.Utils.Url.getDocUrl('./assets') + this.imgFolder);
                    //     // this.saveInfo('imgFolder', this.imgFolder);
                    // },
                    async openPsd() {
                        this.psdOutput = await this.openFolder(this.psdOutput == '' ? '.' : this.psdOutput);
                        this.name = basename(this.psdOutput);
                        // this.saveInfo('psdOutput', this.psdOutput);
                    },
                    async download() {
                        let path = await this.openFolder(Editor.Utils.Url.getDocUrl('.'));
                        Editor.Message.send('auto-create-prefab', 'downloadJSX', path);
                    },
                    // async openTextureRoot() {
                    //     this.imgRootFolder = await this.openFolder(Editor.Utils.Url.getDocUrl('./assets') + this.imgRootFolder);
                    //     // this.saveInfo('imgRootFolder', this.imgRootFolder);
                    // },
                    checkOnlyAtlas() {
                        this.onlyAtlas = !this.onlyAtlas;
                    },
                    checkCanRotate(){
                        this.canRotate = !this.canRotate;
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
                        // if (this.imgFolder == '') {
                        //     alert('请选择导入图片资源的目录！')
                        //     return;
                        // }
                        // if (this.imgRootFolder == '') {
                        //     alert('请选择图片资源根目录！')
                        //     return;
                        // }
                        if (this.psdOutput == '') {
                            alert('请选择psd导出文件夹！')
                            return;
                        }

                        Editor.Message.send('auto-create-prefab', 'ok', JSON.stringify({
                            name: this.name,
                            input: this.psdOutput,
                            output: this.prefabFolder,
                            onlyAtlas: this.onlyAtlas,
                            canRotate: this.canRotate
                            // image: this.imgFolder,
                            // imageRoot: this.imgRootFolder
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
                        // console.log(a);
                        // if (basePath == '.')
                        //     return a;
                        // else {
                        //     return a.replace(basePath, '');
                        // }
                    },
                    // initInfo() {
                    //     var str = '{}';
                    //     try {
                    //         var base = Editor.Project.path + '/autoCreatePrefabConfig.json';
                    //         str = readFileSync(base, 'utf-8');
                    //     } catch (e) { }
                    //     var config = JSON.parse(str);
                    //     this.prefabFolder = config['prefabFolder'] || '';
                    //     this.imgFolder = config['imgFolder'] || '';
                    //     this.imgRootFolder = config['imgRootFolder'] || '';
                    //     this.psdOutput = config['psdOutput'] || '';
                    // },

                    // saveInfo(key: string, value: any) {
                    //     var str = '{}';
                    //     try {
                    //         var base = Editor.Project.path + '/autoCreatePrefabConfig.json';
                    //         console.log(base);
                    //         str = readFileSync(base, 'utf-8');
                    //         var config = JSON.parse(str);
                    //         config[key] = value;
                    //         writeFileSync(base, JSON.stringify(config));
                    //     } catch (e) { }
                    // }
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
