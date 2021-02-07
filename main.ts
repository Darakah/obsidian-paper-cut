import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, FrontMatterCache, CachedMetadata } from 'obsidian';

interface PapercutSettings {
	PAPER_CUT_TAG: string;
	PAPER_CUT_LIMIT: number;
	APPLY_TO_ALL: boolean;
}

const DEFAULT_SETTINGS: PapercutSettings = {
	PAPER_CUT_TAG: 'papercut',
	PAPER_CUT_LIMIT: 5000,
	APPLY_TO_ALL: false
}

export default class PapercutPlugin extends Plugin {
	settings: PapercutSettings;
    statusBar: HTMLElement;

    super(){
        statusBar: this.statusBar;
    }

	async onload() {
        // Send output to console
        console.log('Loaded Comments Plugin');
        await this.loadSettings();

        this.cut = this.cut.bind(this);
        this.registerEvent(this.app.workspace.on("layout-ready", this.cut));
        this.registerEvent(this.app.workspace.on("file-open", this.cut));
        this.registerEvent(this.app.workspace.on("quick-preview", this.cut));
        this.registerEvent(this.app.vault.on("delete", this.cut));

        // Add status bar to update
        this.statusBar = this.addStatusBarItem();
       	this.addSettingTab(new PapercutSettingTab(this.app, this));

        // Run cut function on load
        this.cut();
	}

	async cut(){
		// Only work if the current Active file is an md note
        let active_leaf = this.app.workspace.getActiveFile()
        // if its not an active leaf remove status bar and return
        if(!active_leaf){
            this.statusBar.empty();
            return;
        } 
        
        // check if active leaf has metadataCache
        let page_cache = this.app.metadataCache.getFileCache(active_leaf);
        if(!page_cache){
            this.statusBar.empty();
            return;
        }

        // if the apply to all condition is not active
        if(!this.settings.APPLY_TO_ALL){
            // check for existance of frontmatter
            if(!page_cache.frontmatter){
                this.statusBar.empty();
                return;  
            }
            
            // check if the frontmatter has tags info
            if(!page_cache.frontmatter.tags){
                this.statusBar.empty();
                return;     
            }

            // check if the plugin tag is included in the list
            if(!page_cache.frontmatter.tags.includes(this.settings.PAPER_CUT_TAG)){
                this.statusBar.empty();
                return;     
            }           
        }

        // All checks passed, active leaf has cache & either the apply to all option
        // is chosen or the page has the correct tab
        let page_content = await this.app.vault.read(active_leaf); 
        // Check the number of characters on the current active page
        let page_len = page_content.replace(/[\s\*=-]/g, '').length;
        let fill_perc = (page_len / this.settings.PAPER_CUT_LIMIT) * 100;
        
        let mid, lhs, rhs, tmp_content;
        tmp_content = "";
        
        if(page_len > this.settings.PAPER_CUT_LIMIT){
            this.statusBar.setText('100 %');
            // get the illegal text
            lhs = this.settings.PAPER_CUT_LIMIT;
            rhs = page_content.length;
        
            while ((tmp_content.replace(/[\s\*=-]/g, '').length < this.settings.PAPER_CUT_LIMIT) && (lhs < rhs)) {
                mid = lhs + (rhs - lhs) / 2;
                let tmp = tmp_content + page_content.substring(tmp_content.length, mid);
                if (tmp.replace(/[\s\*=-]/g, '').length < this.settings.PAPER_CUT_LIMIT) {
                    lhs = mid + 1;
                    tmp_content = tmp_content + page_content.substring(tmp_content.length, mid);
                }
                else {
                    rhs = mid - 1;
                }
            }
            // update the page content
            this.app.vault.adapter.write(active_leaf.path, page_content.substring(0, mid));
            return;
        } else {
            this.statusBar.setText(Math.floor(fill_perc * 100) / 100 + " %");
            return;
        }
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class PapercutSettingTab extends PluginSettingTab {
	plugin: PapercutPlugin;

	constructor(app: App, plugin: PapercutPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Paper Cut Tag')
			.setDesc('Tag to specify which notes to paper cut. e.g. papercut for #papercut tag')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.PAPER_CUT_TAG)
				.setValue('')
				.onChange(async (value) => {
					this.plugin.settings.PAPER_CUT_TAG = value;
                    await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Paper Cut Limit')
			.setDesc('The maximum number of characters that a cut paper can hold. Does not include whitespaces and other non-informative characters!')
			.addText(text => text
				.setPlaceholder("" + this.plugin.settings.PAPER_CUT_LIMIT)
				.setValue('')
				.onChange(async (value) => {
					this.plugin.settings.PAPER_CUT_LIMIT = +value;
                    await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Paper Cut ALL !! DANGER !!')
			.setDesc('Applies Paper Cut to all notes by default (no tag specificity)')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.APPLY_TO_ALL);
				toggle.onChange(async (value) => {
					this.plugin.settings.APPLY_TO_ALL = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
