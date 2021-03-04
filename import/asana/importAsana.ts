// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as fs from 'fs'
import minimist from 'minimist'
import {exit} from 'process'
import {ArchiveUtils} from '../../webapp/src/blocks/archive'
import {IBlock} from '../../webapp/src/blocks/block'
import {IPropertyOption, IPropertyTemplate, MutableBoard} from '../../webapp/src/blocks/board'
import {MutableBoardView} from '../../webapp/src/blocks/boardView'
import {MutableCard} from '../../webapp/src/blocks/card'
import {MutableTextBlock} from '../../webapp/src/blocks/textBlock'
import {Asana, Workspace} from './asana'
import {Utils} from './utils'

// HACKHACK: To allow Utils.CreateGuid to work
(global.window as any) = {}

const optionColors = [
    // 'propColorDefault',
    'propColorGray',
    'propColorBrown',
    'propColorOrange',
    'propColorYellow',
    'propColorGreen',
    'propColorBlue',
    'propColorPurple',
    'propColorPink',
    'propColorRed',
]
let optionColorIndex = 0

function main() {
    const args: minimist.ParsedArgs = minimist(process.argv.slice(2))

    const inputFile = args['i']
    const outputFile = args['o'] || 'archive.focalboard'

    if (!inputFile) {
        showHelp()
    }

    if (!fs.existsSync(inputFile)) {
        console.error(`File not found: ${inputFile}`)
        exit(2)
    }

    // Read input
    const inputData = fs.readFileSync(inputFile, 'utf-8')
    const input = JSON.parse(inputData) as Asana

    // Convert
    const blocks = convert(input)

    // Save output
    // TODO: Stream output
    const outputData = ArchiveUtils.buildBlockArchive(blocks)
    fs.writeFileSync(outputFile, outputData)

    console.log(`Exported to ${outputFile}`)
}

function getProjects(input: Asana): Workspace[] {
    const projectMap = new Map<string, Workspace>()

    input.data.forEach(datum => {
        datum.projects.forEach(project => {
            if (!projectMap.get(project.gid)) {
                projectMap.set(project.gid, project)
            }
        })
    })

    return [...projectMap.values()]
}

function getSections(input: Asana, projectId: string): Workspace[] {
    const sectionMap = new Map<string, Workspace>()

    input.data.forEach(datum => {
        const membership = datum.memberships.find(o => o.project.gid === projectId)
        if (membership) {
            if (!sectionMap.get(membership.section.gid)) {
                sectionMap.set(membership.section.gid, membership.section)
            }
        }
    })

    return [...sectionMap.values()]
}

function convert(input: Asana): IBlock[] {
    const projects = getProjects(input)
    if (projects.length < 1) {
        console.error('No projects found')
        return []
    }

    // TODO: Handle multiple projects
    const project = projects[0]

    const blocks: IBlock[] = []

    // Board
    const board = new MutableBoard()
    console.log(`Board: ${project.name}`)
    board.rootId = board.id
    board.title = project.name

    // Convert sections (columns) to a Select property
    const optionIdMap = new Map<string, string>()
    const options: IPropertyOption[] = []
    const sections = getSections(input, project.gid)
    sections.forEach(section => {
        const optionId = Utils.createGuid()
        optionIdMap.set(section.gid, optionId)
        const color = optionColors[optionColorIndex % optionColors.length]
        optionColorIndex += 1
        const option: IPropertyOption = {
            id: optionId,
            value: section.name,
            color,
        }
        options.push(option)
    })

    const cardProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Section',
        type: 'select',
        options
    }
    board.cardProperties = [cardProperty]
    blocks.push(board)

    // Board view
    const view = new MutableBoardView()
    view.title = 'Board View'
    view.viewType = 'board'
    view.rootId = board.id
    view.parentId = board.id
    blocks.push(view)

    // Cards
    input.data.forEach(card => {
        console.log(`Card: ${card.name}`)

        const outCard = new MutableCard()
        outCard.title = card.name
        outCard.rootId = board.id
        outCard.parentId = board.id

        // Map lists to Select property options
        const membership = card.memberships.find(o => o.project.gid === project.gid)
        if (membership) {
            const optionId = optionIdMap.get(membership.section.gid)
            if (optionId) {
                outCard.properties[cardProperty.id] = optionId
            } else {
                console.warn(`Invalid idList: ${membership.section.gid} for card: ${card.name}`)
            }
        } else {
            console.warn(`Missing idList for card: ${card.name}`)
        }

        blocks.push(outCard)

        if (card.notes) {
            // console.log(`\t${card.notes}`)
            const text = new MutableTextBlock()
            text.title = card.notes
            text.rootId = board.id
            text.parentId = outCard.id
            blocks.push(text)

            outCard.contentOrder = [text.id]
        }
    })

    console.log('')
    console.log(`Found ${input.data.length} card(s).`)

    return blocks
}

function showHelp() {
    console.log('import -i <input.json> -o [output.focalboard]')
    exit(1)
}

main()
