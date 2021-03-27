// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IBlock} from '../blocks/block'
import {sendFlashMessage} from '../components/flashMessages'
import Workspace from '../components/workspace'
import mutator from '../mutator'
import octoClient from '../octoClient'
import {OctoListener} from '../octoListener'
import {Utils} from '../utils'
import {BoardTree, MutableBoardTree} from '../viewModel/boardTree'
import {MutableWorkspaceTree, WorkspaceTree} from '../viewModel/workspaceTree'
import './boardPage.scss'

type Props = {
    readonly?: boolean
    workspaceId: string
    setLanguage: (lang: string) => void
    intl: IntlShape
}

type State = {
    boardId: string
    viewId: string
    workspaceTree: WorkspaceTree
    boardTree?: BoardTree
    syncFailed?: boolean
}

class BoardPage extends React.Component<Props, State> {
    private workspaceListener = new OctoListener()

    constructor(props: Props) {
        super(props)

        const queryString = new URLSearchParams(window.location.search)
        let boardId = queryString.get('id') || ''
        let viewId = queryString.get('v') || ''

        if (!boardId) {
            // Load last viewed boardView
            boardId = localStorage.getItem('lastBoardId') || ''
            viewId = localStorage.getItem('lastViewId') || ''
            if (boardId) {
                Utils.replaceUrlQueryParam('id', boardId)
            }
            if (viewId) {
                Utils.replaceUrlQueryParam('v', viewId)
            }
        }

        this.state = {
            boardId,
            viewId,
            workspaceTree: new MutableWorkspaceTree(),
        }

        Utils.log(`BoardPage. boardId: ${boardId}`)
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidUpdate(prevProps: Props, prevState: State): void {
        Utils.log('componentDidUpdate')
        const board = this.state.boardTree?.board
        const prevBoard = prevState.boardTree?.board

        const activeView = this.state.boardTree?.activeView
        const prevActiveView = prevState.boardTree?.activeView

        if (board?.icon !== prevBoard?.icon) {
            Utils.setFavicon(board?.icon)
        }
        if (board?.title !== prevBoard?.title || activeView?.title !== prevActiveView?.title) {
            if (board) {
                let title = `${board.title}`
                if (activeView?.title) {
                    title += ` | ${activeView.title}`
                }
                document.title = title
            } else {
                document.title = 'OCTO'
            }
        }
    }

    private undoRedoHandler = async (e: KeyboardEvent) => {
        if (e.target !== document.body) {
            return
        }

        if (this.props.readonly) {
            return
        }

        if (e.keyCode === 90 && !e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) { // Cmd+Z
            Utils.log('Undo')
            if (mutator.canUndo) {
                const description = mutator.undoDescription
                await mutator.undo()
                if (description) {
                    sendFlashMessage({content: `Undo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Undo', severity: 'low'})
                }
            } else {
                sendFlashMessage({content: 'Nothing to Undo', severity: 'low'})
            }
        } else if (e.keyCode === 90 && e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) { // Shift+Cmd+Z
            Utils.log('Redo')
            if (mutator.canRedo) {
                const description = mutator.redoDescription
                await mutator.redo()
                if (description) {
                    sendFlashMessage({content: `Redo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Redu', severity: 'low'})
                }
            } else {
                sendFlashMessage({content: 'Nothing to Redo', severity: 'low'})
            }
        }
    }

    componentDidMount(): void {
        document.addEventListener('keydown', this.undoRedoHandler)
        if (this.state.boardId) {
            this.attachToBoard(this.state.boardId, this.state.viewId)
        } else {
            this.sync()
        }
    }

    componentWillUnmount(): void {
        Utils.log(`boardPage.componentWillUnmount: ${this.state.boardId}`)
        this.workspaceListener.close()
        document.removeEventListener('keydown', this.undoRedoHandler)
    }

    render(): JSX.Element {
        const {intl} = this.props
        const {workspaceTree} = this.state

        Utils.log(`BoardPage.render (workspace ${this.props.workspaceId}) ${this.state.boardTree?.board?.title}`)

        // TODO: Make this less brittle. This only works because this is the root render function
        octoClient.workspaceId = this.props.workspaceId

        if (this.props.readonly && this.state.syncFailed) {
            Utils.log('BoardPage.render: sync failed')
            return (
                <div className='BoardPage'>
                    <div className='error'>
                        {intl.formatMessage({id: 'BoardPage.syncFailed', defaultMessage: 'Board may be deleted or access revoked.'})}
                    </div>
                </div>
            )
        }

        return (
            <div className='BoardPage'>
                <Workspace
                    workspaceTree={workspaceTree}
                    boardTree={this.state.boardTree}
                    showView={(id, boardId) => {
                        this.showView(id, boardId)
                    }}
                    showBoard={(id) => {
                        this.showBoard(id)
                    }}
                    setSearchText={(text) => {
                        this.setSearchText(text)
                    }}
                    setLanguage={this.props.setLanguage}
                    readonly={this.props.readonly || false}
                />
            </div>
        )
    }

    private async attachToBoard(boardId?: string, viewId = '') {
        Utils.log(`attachToBoard: ${boardId}`)
        localStorage.setItem('lastBoardId', boardId || '')
        localStorage.setItem('lastViewId', viewId)

        if (boardId) {
            this.sync(boardId, viewId)
        } else {
            // No board
            this.setState({
                boardTree: undefined,
                boardId: '',
                viewId: '',
            })
        }
    }

    private async sync(boardId: string = this.state.boardId, viewId: string | undefined = this.state.viewId) {
        Utils.log(`sync start: ${boardId}`)

        if (!this.props.readonly) {
            // Require workspace for editing, not for sharing (readonly)

            const workspace = await octoClient.getWorkspace()
            if (!workspace) {
                location.href = '/error?id=no_workspace'
            }

            const workspaceTree = await MutableWorkspaceTree.sync()
            const boardIds = [...workspaceTree.boards.map((o) => o.id), ...workspaceTree.boardTemplates.map((o) => o.id)]
            this.setState({workspaceTree})

            let boardIdsToListen: string[]
            if (boardIds.length > 0) {
                boardIdsToListen = ['', ...boardIds]
            } else {
                // Read-only view
                boardIdsToListen = [this.state.boardId]
            }

            // Listen to boards plus all blocks at root (Empty string for parentId)
            this.workspaceListener.open(
                octoClient.workspaceId,
                boardIdsToListen,
                async (blocks) => {
                    Utils.log(`workspaceListener.onChanged: ${blocks.length}`)
                    this.incrementalUpdate(blocks)
                },
                () => {
                    Utils.log('workspaceListener.onReconnect')
                    this.sync()
                },
            )
        }

        if (boardId) {
            const boardTree = await MutableBoardTree.sync(boardId, viewId)

            if (boardTree && boardTree.board) {
                // Update url with viewId if it's different
                if (boardTree.activeView.id !== this.state.viewId) {
                    Utils.replaceUrlQueryParam('v', boardTree.activeView.id)
                }

                // TODO: Handle error (viewId not found)

                this.setState({
                    boardTree,
                    boardId,
                    viewId: boardTree.activeView!.id,
                    syncFailed: false,
                })
                Utils.log(`sync complete: ${boardTree.board?.id} (${boardTree.board?.title})`)
            } else {
                // Board may have been deleted
                this.setState({
                    boardTree: undefined,
                    viewId: '',
                    syncFailed: true,
                })
                Utils.log(`sync complete: board ${boardId} not found`)
            }
        }
    }

    private async incrementalUpdate(blocks: IBlock[]) {
        const {workspaceTree, boardTree, viewId} = this.state

        let newState = {workspaceTree, boardTree, viewId}

        const newWorkspaceTree = MutableWorkspaceTree.incrementalUpdate(workspaceTree, blocks)
        if (newWorkspaceTree) {
            newState = {...newState, workspaceTree: newWorkspaceTree}
        }

        let newBoardTree: BoardTree | undefined
        if (boardTree) {
            newBoardTree = MutableBoardTree.incrementalUpdate(boardTree, blocks)
        } else if (this.state.boardId) {
            // Corner case: When the page is viewing a deleted board, that is subsequently un-deleted on another client
            newBoardTree = await MutableBoardTree.sync(this.state.boardId, this.state.viewId)
        }

        if (newBoardTree) {
            newState = {...newState, boardTree: newBoardTree, viewId: newBoardTree.activeView.id}
        } else {
            newState = {...newState, boardTree: undefined}
        }

        // Update url with viewId if it's different
        if (newBoardTree && newBoardTree.activeView.id !== this.state.viewId) {
            Utils.replaceUrlQueryParam('v', newBoardTree?.activeView.id)
        }

        this.setState(newState)
    }

    // IPageController
    showBoard(boardId?: string): void {
        const {boardTree} = this.state

        if (boardTree?.board?.id === boardId) {
            return
        }

        const newUrl = new URL(window.location.toString())
        newUrl.searchParams.set('id', boardId || '')
        newUrl.searchParams.set('v', '')
        window.history.pushState({path: newUrl.toString()}, '', newUrl.toString())

        this.attachToBoard(boardId)
    }

    showView(viewId: string, boardId: string = this.state.boardId): void {
        localStorage.setItem('lastViewId', viewId)

        if (this.state.boardTree && this.state.boardId === boardId) {
            const newBoardTree = this.state.boardTree.copyWithView(viewId)
            this.setState({boardTree: newBoardTree, viewId})
        } else {
            this.attachToBoard(boardId, viewId)
        }

        const newUrl = new URL(window.location.toString())
        newUrl.searchParams.set('id', boardId)
        newUrl.searchParams.set('v', viewId)
        window.history.pushState({path: newUrl.toString()}, '', newUrl.toString())
    }

    setSearchText(text?: string): void {
        if (!this.state.boardTree) {
            Utils.assertFailure('setSearchText: boardTree')
            return
        }

        const newBoardTree = this.state.boardTree.copyWithSearchText(text)
        this.setState({boardTree: newBoardTree})
    }
}

export default injectIntl(BoardPage)
