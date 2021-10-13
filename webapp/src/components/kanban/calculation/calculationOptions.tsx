// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {
    CalculationOptions,
    CommonCalculationOptionProps,
    optionsByType,
} from '../../calculations/options'
import {IPropertyTemplate} from '../../../blocks/board'

import './calculationOption.scss'
import {Option, OptionProps} from './kanbanOption'

type Props = CommonCalculationOptionProps & {
    cardProperties: IPropertyTemplate[]
    onChange: (data: {calculation: string, propertyId: string}) => void
}

export const KanbanCalculationOptions = (props: Props): JSX.Element => {
    const options: OptionProps[] = []

    // Show common options, first,
    // followed by type-specific functions
    optionsByType.get('common')!.forEach((typeOption) => {
        if (typeOption.value !== 'none') {
            options.push({
                ...typeOption,
                cardProperties: props.cardProperties,
                onChange: props.onChange,
                activeValue: props.value,
                activeProperty: props.property!,
            })
        }
    })

    props.cardProperties.
        map((property) => optionsByType.get(property.type) || []).
        forEach((typeOptions) => {
            typeOptions.forEach((typeOption) => {
                options.push({
                    ...typeOption,
                    cardProperties: props.cardProperties,
                    onChange: props.onChange,
                    activeValue: props.value,
                    activeProperty: props.property!,
                })
            })
        })

    return (
        <CalculationOptions
            value={props.value}
            menuOpen={props.menuOpen}
            onClose={props.onClose}
            onChange={props.onChange}
            property={props.property}
            options={options}
            components={{Option}}
        />
    )
}
