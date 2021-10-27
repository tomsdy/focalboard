// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IUser} from '../user'

import {TelemetryHandler} from './telemetry'

export const TelemetryCategory = 'boards'

export const TelemetryActions = {
    ClickChannelHeader: 'clickChannelHeader',
    ViewBoard: 'viewBoard',
    CreateBoard: 'createBoard',
    DuplicateBoard: 'duplicateBoard',
    DeleteBoard: 'deleteBoard',
    ShareBoard: 'shareBoard',
    CreateBoardTemplate: 'createBoardTemplate',
    CreateBoardViaTemplate: 'createBoardViaTemplate',
    AddTemplateFromBoard: 'AddTemplateFromBoard',
    CreateBoardView: 'createBoardView',
    DuplicateBoardView: 'duplicagteBoardView',
    DeleteBoardView: 'deleteBoardView',
    EditCardProperty: 'editCardProperty',
    ViewCard: 'viewCard',
    CreateCard: 'createCard',
    CreateCardTemplate: 'createCardTemplate',
    CreateCardViaTemplate: 'createCardViaTemplate',
    DuplicateCard: 'duplicateCard',
    DeleteCard: 'deleteCard',
    AddTemplateFromCard: 'addTemplateFromCard',
    ViewSharedBoard: 'viewSharedBoard',
}

interface IEventProps {
    workspaceID?: string,
    board?: string,
    view?: string,
    viewType?: string,
    card?: string,
    cardTemplateId?: string,
    boardTemplateId?: string,
    shareBoardEnabled?: boolean,
}

class TelemetryClient {
    public telemetryHandler?: TelemetryHandler
    public user?: IUser

    setTelemetryHandler(telemetryHandler?: TelemetryHandler): void {
        this.telemetryHandler = telemetryHandler
    }

    setUser(user: IUser): void {
        this.user = user
    }

    trackEvent(category: string, event: string, props?: IEventProps): void {
        if (this.telemetryHandler) {
            const userId = this.user?.id
            this.telemetryHandler.trackEvent(userId || '', '', category, event, props)
        }
    }

    pageVisited(category: string, name: string): void {
        if (this.telemetryHandler) {
            const userId = this.user?.id
            this.telemetryHandler.pageVisited(userId || '', '', category, name)
        }
    }
}

const telemetryClient = new TelemetryClient()

export {TelemetryClient}
export default telemetryClient
