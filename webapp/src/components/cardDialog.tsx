// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import mutator from '../mutator'
import {Utils} from '../utils'
import {BoardView} from '../blocks/boardView'
import {Board} from '../blocks/board'
import {Card} from '../blocks/card'
import DeleteIcon from '../widgets/icons/delete'
import Menu from '../widgets/menu'

import {useAppSelector} from '../store/hooks'
import {getCard} from '../store/cards'
import {getCardContents} from '../store/contents'
import {getCardComments} from '../store/comments'

import CardDetail from './cardDetail/cardDetail'
import Dialog from './dialog'

type Props = {
    board: Board
    activeView: BoardView
    views: BoardView[]
    cards: Card[]
    cardId: string
    onClose: () => void
    showCard: (cardId?: string) => void
    readonly: boolean
}

const CardDialog = (props: Props) => {
    const {board, activeView, cards, views} = props
    const card = useAppSelector(getCard(props.cardId))
    const contents = useAppSelector(getCardContents(props.cardId))
    const comments = useAppSelector(getCardComments(props.cardId))
    const intl = useIntl()

    const makeTemplateClicked = async () => {
        if (!card) {
            Utils.assertFailure('card')
            return
        }

        await mutator.duplicateCard(
            props.cardId,
            intl.formatMessage({id: 'Mutator.new-template-from-card', defaultMessage: 'new template from card'}),
            true,
            async (newCardId) => {
                props.showCard(newCardId)
            },
            async () => {
                props.showCard(undefined)
            },
        )
    }

    const menu = (
        <Menu position='left'>
            <Menu.Text
                id='delete'
                icon={<DeleteIcon/>}
                name='Delete'
                onClick={async () => {
                    if (!card) {
                        Utils.assertFailure()
                        return
                    }
                    await mutator.deleteBlock(card, 'delete card')
                    props.onClose()
                }}
            />
            {(card && !card.fields.isTemplate) &&
                <Menu.Text
                    id='makeTemplate'
                    name='New template from card'
                    onClick={makeTemplateClicked}
                />
            }
        </Menu>
    )
    return (
        <Dialog
            onClose={props.onClose}
            toolsMenu={!props.readonly && menu}
        >
            {card && card.fields.isTemplate &&
                <div className='banner'>
                    <FormattedMessage
                        id='CardDialog.editing-template'
                        defaultMessage="You're editing a template"
                    />
                </div>}

            {card &&
                <CardDetail
                    board={board}
                    activeView={activeView}
                    views={views}
                    cards={cards}
                    card={card}
                    contents={contents}
                    comments={comments}
                    readonly={props.readonly}
                />}

            {!card &&
                <div className='banner error'>
                    <FormattedMessage
                        id='CardDialog.nocard'
                        defaultMessage="This card doesn't exist or is inaccessible"
                    />
                </div>}
        </Dialog>
    )
}

export default CardDialog
