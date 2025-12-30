import { _decorator, Component, ToggleContainer, EditBox } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('feedback')
export class FeedbackView extends Component {
    @property(ToggleContainer)
    typeContainer: ToggleContainer | null = null;
    @property(EditBox)
    editBox: EditBox | null = null;

    get feedType(): number {
        if (!this.typeContainer) return 0;
        const toggles = this.typeContainer.toggleItems;
        for (let i = 0; i < toggles.length; i++) {
            if (toggles[i].isChecked) return i + 1;
        }
        return 0;
    }

    onLoad() {

    }

    async onClickSubmit() {
        if (!this.editBox) return;

        const text = this.editBox.string.trim();
        if (text.length <= 0) {
            App.AlertManager.showFloatTip('Please provide a text description');
            return;
        }

        try {
            await App.ApiManager.submitSuggest(text);
            this.editBox.string = '';
            App.AlertManager.showFloatTip('Submission successful');
        } catch (error) {
            App.AlertManager.showFloatTip('Submission failed, please try again later');
        }
    }
}
