// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Card} from '../../blocks/card'
import {IPropertyTemplate} from '../../blocks/board'
import {Utils} from '../../utils'
import {Constants} from '../../constants'

const ROUNDED_DECIMAL_PLACES = 2

function getCardProperty(card: Card, property: IPropertyTemplate): string | string[] | number {
    if (property.id === Constants.titleColumnId) {
        return card.title
    }

    switch (property.type) {
    case ('createdBy'): {
        return card.createdBy
    }
    case ('createdTime'): {
        return card.createAt
    }
    case ('updatedBy'): {
        return card.modifiedBy
    }
    case ('updatedTime'): {
        return card.updateAt
    }
    default: {
        return card.fields.properties[property.id]
    }
    }
}

function cardsWithValue(cards: readonly Card[], property: IPropertyTemplate): Card[] {
    return cards.
        filter((card) => Boolean(getCardProperty(card, property)))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function count(cards: readonly Card[], property: IPropertyTemplate): string {
    return String(cards.length)
}

function countValue(cards: readonly Card[], property: IPropertyTemplate): string {
    let values = 0

    if (property.type === 'multiSelect') {
        cardsWithValue(cards, property).
            forEach((card) => {
                values += (getCardProperty(card, property) as string[]).length
            })
    } else {
        values = cardsWithValue(cards, property).length
    }

    return String(values)
}

function countUniqueValue(cards: readonly Card[], property: IPropertyTemplate): string {
    const valueMap: Map<string | string[], boolean> = new Map()

    cards.forEach((card) => {
        const value = getCardProperty(card, property)

        if (!value) {
            return
        }

        if (property.type === 'multiSelect') {
            (value as string[]).forEach((v) => valueMap.set(v, true))
        } else {
            valueMap.set(String(value), true)
        }
    })

    return String(valueMap.size)
}

function sum(cards: readonly Card[], property: IPropertyTemplate): string {
    let result = 0

    cardsWithValue(cards, property).
        forEach((card) => {
            result += parseFloat(getCardProperty(card, property) as string)
        })

    return String(Utils.roundTo(result, ROUNDED_DECIMAL_PLACES))
}

function average(cards: readonly Card[], property: IPropertyTemplate): string {
    const numCards = cardsWithValue(cards, property).length
    if (numCards === 0) {
        return '0'
    }

    const result = parseFloat(sum(cards, property))
    const avg = result / numCards
    return String(Utils.roundTo(avg, ROUNDED_DECIMAL_PLACES))
}

function median(cards: readonly Card[], property: IPropertyTemplate): string {
    const sorted = cardsWithValue(cards, property).
        sort((a, b) => {
            if (!getCardProperty(a, property)) {
                return 1
            }

            if (!getCardProperty(b, property)) {
                return -1
            }

            const aValue = parseFloat(getCardProperty(a, property) as string || '0')
            const bValue = parseFloat(getCardProperty(b, property) as string || '0')

            return aValue - bValue
        })

    if (sorted.length === 0) {
        return '0'
    }

    let result: number

    if (sorted.length % 2 === 0) {
        const val1 = parseFloat(getCardProperty(sorted[sorted.length / 2], property) as string)
        const val2 = parseFloat(getCardProperty(sorted[(sorted.length / 2) - 1], property) as string)
        result = (val1 + val2) / 2
    } else {
        result = parseFloat(getCardProperty(sorted[Math.floor(sorted.length / 2)], property) as string)
    }

    return String(Utils.roundTo(result, ROUNDED_DECIMAL_PLACES))
}

function min(cards: readonly Card[], property: IPropertyTemplate): string {
    let result = Number.POSITIVE_INFINITY
    cards.forEach((card) => {
        if (!getCardProperty(card, property)) {
            return
        }

        const value = parseFloat(getCardProperty(card, property) as string)
        result = Math.min(result, value)
    })

    return String(result === Number.POSITIVE_INFINITY ? '0' : String(Utils.roundTo(result, ROUNDED_DECIMAL_PLACES)))
}

function max(cards: readonly Card[], property: IPropertyTemplate): string {
    let result = Number.NEGATIVE_INFINITY
    cards.forEach((card) => {
        if (!getCardProperty(card, property)) {
            return
        }

        const value = parseFloat(getCardProperty(card, property) as string)
        result = Math.max(result, value)
    })

    return String(result === Number.NEGATIVE_INFINITY ? '0' : String(Utils.roundTo(result, ROUNDED_DECIMAL_PLACES)))
}

function range(cards: readonly Card[], property: IPropertyTemplate): string {
    return min(cards, property) + ' - ' + max(cards, property)
}

const Calculations: Record<string, (cards: readonly Card[], property: IPropertyTemplate) => string> = {
    count,
    countValue,
    countUniqueValue,
    sum,
    average,
    median,
    min,
    max,
    range,
}

export default Calculations
