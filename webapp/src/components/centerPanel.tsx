// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'
import {connect} from 'react-redux'
import Hotkeys from 'react-hot-keys'

import {BlockIcons} from '../blockIcons'
import {Card, createCard} from '../blocks/card'
import {Board, IPropertyTemplate, IPropertyOption, BoardGroup} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import {CardFilter} from '../cardFilter'
import mutator from '../mutator'
import {Utils} from '../utils'
import {UserSettings} from '../userSettings'
import {addCard, addTemplate} from '../store/cards'

import './centerPanel.scss'

import CardDialog from './cardDialog'
import RootPortal from './rootPortal'
import TopBar from './topBar'
import ViewHeader from './viewHeader/viewHeader'
import ViewTitle from './viewTitle'
import Kanban from './kanban/kanban'
import Table from './table/table'
import Gallery from './gallery/gallery'

type Props = {
    board: Board
    cards: Card[]
    activeView: BoardView
    views: BoardView[]
    groupByProperty?: IPropertyTemplate
    intl: IntlShape
    readonly: boolean
    addCard: (card: Card) => void
    addTemplate: (template: Card) => void
}

type State = {
    shownCardId?: string
    selectedCardIds: string[]
    cardIdToFocusOnRender: string
}

class CenterPanel extends React.Component<Props, State> {
    private backgroundRef = React.createRef<HTMLDivElement>()

    private keydownHandler = (keyName: string, e: KeyboardEvent) => {
        if (e.target !== document.body || this.props.readonly) {
            return
        }

        if (keyName === 'esc') {
            if (this.state.selectedCardIds.length > 0) {
                this.setState({selectedCardIds: []})
                e.stopPropagation()
            }
        }

        if (this.state.selectedCardIds.length > 0) {
            if (keyName === 'del' || keyName === 'backspace') {
                // Backspace or Del: Delete selected cards
                this.deleteSelectedCards()
                e.stopPropagation()
            }

            // TODO: Might need a different hotkey, as Cmd+D is save bookmark on Chrome
            if (keyName === 'ctrl+d') {
                // CTRL+D: Duplicate selected cards
                this.duplicateSelectedCards()
                e.stopPropagation()
                e.preventDefault()
            }
        }
    }

    componentDidMount(): void {
        this.showCardInUrl()
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            selectedCardIds: [],
            cardIdToFocusOnRender: '',
        }
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    private showCardInUrl() {
        const queryString = new URLSearchParams(window.location.search)
        const cardId = queryString.get('c') || undefined
        if (cardId !== this.state.shownCardId) {
            this.setState({shownCardId: cardId})
        }
    }

    render(): JSX.Element {
        const {groupByProperty, activeView, board, views, cards} = this.props
        const {visible: visibleGroups, hidden: hiddenGroups} = this.getVisibleAndHiddenGroups(cards, activeView.fields.visibleOptionIds, activeView.fields.hiddenOptionIds, groupByProperty)

        return (
            <div
                className='BoardComponent'
                ref={this.backgroundRef}
                onClick={(e) => {
                    this.backgroundClicked(e)
                }}
            >
                <Hotkeys
                    keyName='ctrl+d,del,esc,backspace'
                    onKeyDown={this.keydownHandler}
                />
                {this.state.shownCardId &&
                    <RootPortal>
                        <CardDialog
                            board={board}
                            activeView={activeView}
                            views={views}
                            cards={cards}
                            key={this.state.shownCardId}
                            cardId={this.state.shownCardId}
                            onClose={() => this.showCard(undefined)}
                            showCard={(cardId) => this.showCard(cardId)}
                            readonly={this.props.readonly}
                        />
                    </RootPortal>}

                <div className='top-head'>
                    <TopBar/>
                    <ViewTitle
                        key={board.id + board.title}
                        board={board}
                        readonly={this.props.readonly}
                    />
                    <ViewHeader
                        board={this.props.board}
                        activeView={this.props.activeView}
                        cards={this.props.cards}
                        views={this.props.views}
                        groupByProperty={this.props.groupByProperty}
                        addCard={() => this.addCard('', true)}
                        addCardFromTemplate={this.addCardFromTemplate}
                        addCardTemplate={this.addCardTemplate}
                        editCardTemplate={this.editCardTemplate}
                        readonly={this.props.readonly}
                    />
                </div>

                {activeView.fields.viewType === 'board' &&
                <Kanban
                    board={this.props.board}
                    activeView={this.props.activeView}
                    cards={this.props.cards}
                    groupByProperty={this.props.groupByProperty}
                    visibleGroups={visibleGroups}
                    hiddenGroups={hiddenGroups}
                    selectedCardIds={this.state.selectedCardIds}
                    readonly={this.props.readonly}
                    onCardClicked={this.cardClicked}
                    addCard={this.addCard}
                    showCard={this.showCard}
                />}

                {activeView.fields.viewType === 'table' &&
                    <Table
                        board={this.props.board}
                        activeView={this.props.activeView}
                        cards={this.props.cards}
                        groupByProperty={this.props.groupByProperty}
                        views={this.props.views}
                        visibleGroups={visibleGroups}
                        selectedCardIds={this.state.selectedCardIds}
                        readonly={this.props.readonly}
                        cardIdToFocusOnRender={this.state.cardIdToFocusOnRender}
                        showCard={this.showCard}
                        addCard={this.addCard}
                        onCardClicked={this.cardClicked}
                    />}

                {activeView.fields.viewType === 'gallery' &&
                    <Gallery
                        board={this.props.board}
                        cards={this.props.cards}
                        activeView={this.props.activeView}
                        readonly={this.props.readonly}
                        onCardClicked={this.cardClicked}
                        selectedCardIds={this.state.selectedCardIds}
                        addCard={(show) => this.addCard('', show)}
                    />}

            </div>
        )
    }

    private backgroundClicked(e: React.MouseEvent) {
        if (this.state.selectedCardIds.length > 0) {
            this.setState({selectedCardIds: []})
            e.stopPropagation()
        }
    }

    private addCardFromTemplate = async (cardTemplateId: string) => {
        await mutator.duplicateCard(
            cardTemplateId,
            this.props.intl.formatMessage({id: 'Mutator.new-card-from-template', defaultMessage: 'new card from template'}),
            false,
            async (newCardId) => {
                this.showCard(newCardId)
            },
            async () => {
                this.showCard(undefined)
            },
        )
    }

    addCard = async (groupByOptionId?: string, show = false): Promise<void> => {
        const {activeView, board, groupByProperty} = this.props

        const card = createCard()

        card.parentId = board.id
        card.rootId = board.rootId
        const propertiesThatMeetFilters = CardFilter.propertiesThatMeetFilterGroup(activeView.fields.filter, board.fields.cardProperties)
        if ((activeView.fields.viewType === 'board' || activeView.fields.viewType === 'table') && groupByProperty) {
            if (groupByOptionId) {
                propertiesThatMeetFilters[groupByProperty.id] = groupByOptionId
            } else {
                delete propertiesThatMeetFilters[groupByProperty.id]
            }
        }
        card.fields.properties = {...card.fields.properties, ...propertiesThatMeetFilters}
        if (!card.fields.icon && UserSettings.prefillRandomIcons) {
            card.fields.icon = BlockIcons.shared.randomIcon()
        }
        await mutator.insertBlock(
            card,
            'add card',
            async () => {
                if (show) {
                    this.props.addCard(card)
                    this.showCard(card.id)
                } else {
                    // Focus on this card's title inline on next render
                    this.setState({cardIdToFocusOnRender: card.id})
                    setTimeout(() => this.setState({cardIdToFocusOnRender: ''}), 100)
                }
            },
            async () => {
                this.showCard(undefined)
            },
        )
    }

    private addCardTemplate = async () => {
        const {board} = this.props

        const cardTemplate = createCard()
        cardTemplate.fields.isTemplate = true
        cardTemplate.parentId = board.id
        cardTemplate.rootId = board.rootId
        await mutator.insertBlock(
            cardTemplate,
            'add card template',
            async () => {
                this.props.addTemplate(cardTemplate)
                this.showCard(cardTemplate.id)
            }, async () => {
                this.showCard(undefined)
            },
        )
    }

    private editCardTemplate = (cardTemplateId: string) => {
        this.showCard(cardTemplateId)
    }

    cardClicked = (e: React.MouseEvent, card: Card): void => {
        const {activeView, cards} = this.props

        if (e.shiftKey) {
            let selectedCardIds = this.state.selectedCardIds.slice()
            if (selectedCardIds.length > 0 && (e.metaKey || e.ctrlKey)) {
                // Cmd+Shift+Click: Extend the selection
                const orderedCardIds = cards.map((o) => o.id)
                const lastCardId = selectedCardIds[selectedCardIds.length - 1]
                const srcIndex = orderedCardIds.indexOf(lastCardId)
                const destIndex = orderedCardIds.indexOf(card.id)
                const newCardIds = (srcIndex < destIndex) ? orderedCardIds.slice(srcIndex, destIndex + 1) : orderedCardIds.slice(destIndex, srcIndex + 1)
                for (const newCardId of newCardIds) {
                    if (!selectedCardIds.includes(newCardId)) {
                        selectedCardIds.push(newCardId)
                    }
                }
                this.setState({selectedCardIds})
            } else {
                // Shift+Click: add to selection
                if (selectedCardIds.includes(card.id)) {
                    selectedCardIds = selectedCardIds.filter((o) => o !== card.id)
                } else {
                    selectedCardIds.push(card.id)
                }
                this.setState({selectedCardIds})
            }
        } else if (activeView.fields.viewType === 'board' || activeView.fields.viewType === 'gallery') {
            this.showCard(card.id)
        }

        e.stopPropagation()
    }

    private showCard = (cardId?: string) => {
        Utils.replaceUrlQueryParam('c', cardId)
        this.setState({selectedCardIds: [], shownCardId: cardId})
    }

    private async deleteSelectedCards() {
        const {selectedCardIds} = this.state
        if (selectedCardIds.length < 1) {
            return
        }

        mutator.performAsUndoGroup(async () => {
            for (const cardId of selectedCardIds) {
                const card = this.props.cards.find((o) => o.id === cardId)
                if (card) {
                    mutator.deleteBlock(card, selectedCardIds.length > 1 ? `delete ${selectedCardIds.length} cards` : 'delete card')
                } else {
                    Utils.assertFailure(`Selected card not found: ${cardId}`)
                }
            }
        })

        this.setState({selectedCardIds: []})
    }

    private async duplicateSelectedCards() {
        const {selectedCardIds} = this.state
        if (selectedCardIds.length < 1) {
            return
        }

        mutator.performAsUndoGroup(async () => {
            for (const cardId of selectedCardIds) {
                const card = this.props.cards.find((o) => o.id === cardId)
                if (card) {
                    mutator.duplicateCard(cardId)
                } else {
                    Utils.assertFailure(`Selected card not found: ${cardId}`)
                }
            }
        })

        this.setState({selectedCardIds: []})
    }
    private groupCardsByOptions(cards: Card[], optionIds: string[], groupByProperty?: IPropertyTemplate): BoardGroup[] {
        const groups = []
        for (const optionId of optionIds) {
            if (optionId) {
                const option = groupByProperty?.options.find((o) => o.id === optionId)
                if (option) {
                    const c = cards.filter((o) => optionId === o.fields.properties[groupByProperty!.id])
                    const group: BoardGroup = {
                        option,
                        cards: c,
                    }
                    groups.push(group)
                } else {
                    Utils.logError(`groupCardsByOptions: Missing option with id: ${optionId}`)
                }
            } else {
                // Empty group
                const emptyGroupCards = cards.filter((card) => {
                    const groupByOptionId = card.fields.properties[groupByProperty?.id || '']
                    return !groupByOptionId || !groupByProperty?.options.find((option) => option.id === groupByOptionId)
                })
                const group: BoardGroup = {
                    option: {id: '', value: `No ${groupByProperty?.name}`, color: ''},
                    cards: emptyGroupCards,
                }
                groups.push(group)
            }
        }
        return groups
    }

    private getVisibleAndHiddenGroups(cards: Card[], visibleOptionIds: string[], hiddenOptionIds: string[], groupByProperty?: IPropertyTemplate): {visible: BoardGroup[], hidden: BoardGroup[]} {
        let unassignedOptionIds: string[] = []
        if (groupByProperty) {
            unassignedOptionIds = groupByProperty.options.
                filter((o: IPropertyOption) => !visibleOptionIds.includes(o.id) && !hiddenOptionIds.includes(o.id)).
                map((o: IPropertyOption) => o.id)
        }
        const allVisibleOptionIds = [...visibleOptionIds, ...unassignedOptionIds]

        // If the empty group positon is not explicitly specified, make it the first visible column
        if (!allVisibleOptionIds.includes('') && !hiddenOptionIds.includes('')) {
            allVisibleOptionIds.unshift('')
        }

        const visibleGroups = this.groupCardsByOptions(cards, allVisibleOptionIds, groupByProperty)
        const hiddenGroups = this.groupCardsByOptions(cards, hiddenOptionIds, groupByProperty)
        return {visible: visibleGroups, hidden: hiddenGroups}
    }
}

export default connect(undefined, {addCard, addTemplate})(injectIntl(CenterPanel))
