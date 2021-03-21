// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import ReactDOM from 'react-dom'

import App from './app'
import {initThemes} from './theme'

import './styles/variables.scss'
import './styles/main.scss'
import './styles/labels.scss'

initThemes()
ReactDOM.render(<App/>, document.getElementById('main-app'))
