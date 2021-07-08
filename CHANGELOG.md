# Focalboard Changelog

Focalboard is an open source, self-hosted alternative to Trello, Notion, Asana and Jira for project management. We help individuals and teams define, organize, track and manage their work.

This changelog summarizes updates to our open source project. You can also find the [latest releases and release notes on GitHub here](https://github.com/mattermost/focalboard/releases).

## [Work In Progress] - vNext Release - [Date TBD]

## v0.8 Release - July, 2021
* CreatedBy property. Thanks @harshilsharma63!
* Fix dragged card order. Thanks @kamre!
* Date format user setting. Thanks @darkLord19!
* Add property tooltip in board view. Thanks @ditsemto!
* Fix plugin links. Thanks @N3rdP1um23!
* Add MySQL documentation. Thanks @ctlaltdieliet and @3l0w!
* RPC API support. Thanks @agnivade!

## v0.7.0 Release - June, 2021
* Multi-select property type. Thanks @hahmadia!
* Checkbox property type. Thanks @mickmister!
* Person property type. Thanks @harshilsharma63!
* Grouped table view. Thanks @sbishel!
* Export individual boards. Thanks @hahmadia!
* Focalboard can now be built as a Mattermost plugin! Thanks @mgdelacroix and @jespino!
* Improved read-only fields display. Thanks @Johennes!
* Improved logging. Thanks @wiggin77!
* Prometheus metrics. Thanks @spirosoik!
* Mac: Open window by clicking on the dock icon. Thanks @Johennes!
* Additional unit tests. Thanks @matheusmosca!
* Fixed Linux app caret display. Thanks @fritsstegmann!
* Added CodeQL check. Thanks @srkgupta!

## v0.6.7 Release - May, 2021

* Key Updates:
    * Added Todoist import script. Thanks @harshilsharma63!
    * Added MySql database support. Thanks @jespino!
    * Added URL and phone number properties. Thanks @BharatKalluri!
    * Added documentation for share board. Thanks @haardikdharma10!
    * Persist Mac app settings. Thanks @Johennes!
    * Improved board sorting without leading emoji. Thanks @Johennes!
    * Added Prettier linting for SCSS. Thanks @signalwerk!
    * Improved table headers. Thanks @sbishel!
    * Disable unused Mac tab menu. Thanks @@haardikdharma10!
    * Fixed server lint issues. Thanks @harshilsharma63!
    * Updated open button. Thanks @arjitc!

## v0.6.5 Release - April 19, 2021

* Key Updates:
  * Focalboard now available on DockerHub at https://hub.docker.com/r/mattermost/focalboard. [#91](https://github.com/mattermost/focalboard/issues/91) Thanks @jwilander @obbardc!
  * You can now contribute translations to Focalboard on https://translate.mattermost.com/. Thanks @jespino!
  * Added German language translation. Thanks @svelle!
  * Added Japanese language translation. Thanks @kaakaa!
  * Added French language translation. Thanks @CyrilLD!
  * Added Occitan language translation. Thanks Quentin PAGÈS!
  * Added Dutch language translation. Thanks Tom De Moor!
  * Added Turkish language translation. Thanks Abdullah Musab!
  * Added Chinese language translation. Thanks Yao Xie and toto6038!
  * Added Russian language translation. Thanks Edward Smirnov!
  * Add Dockerfile to run service in a container. [#76](https://github.com/mattermost/focalboard/pull/76) Thanks @proffalken!
  * Add docker-compose to run the whole service in containers. [#105](https://github.com/mattermost/focalboard/pull/105) Thanks @jbutler992!
  * Added Gallery view.
  * Added Checkbox content type.
  * Added Selected cards duplication with Ctrl+D.
  * Added Search shortcut (Ctrl+Shift+F).
* Requested Contributions
  * Add more frontend unit test coverage. [#126](https://github.com/mattermost/focalboard/pull/126) Thanks @renjithgr!
  * [GH-40](https://github.com/mattermost/focalboard/issues/40) - Add property type email [#84](https://github.com/mattermost/focalboard/pull/84). Thanks @renjithgr!

## v0.6.1 Release - March 15, 2021

* Focalboard Personal Desktop is now live in the App Stores:
    * [Mac App Store](https://apps.apple.com/app/apple-store/id1556908618?pt=2114704&ct=changelog&mt=8)
    * [Microsoft App Store](https://www.microsoft.com/store/apps/9NLN2T0SX9VF?cid=changelog)
* Added [Windows native app (WPF)](https://github.com/mattermost/focalboard/tree/main/win-wpf) support
* Added [Swagger / OpenAPI definition and documentation](https://htmlpreview.github.io/?https://github.com/mattermost/focalboard/blob/main/server/swagger/docs/html/index.html)
* Added [Import scripts for Trello, Asana, and Notion](https://github.com/mattermost/focalboard/tree/main/import)
* Added [Developer Tips and Tricks article](https://www.focalboard.com/contribute/getting-started/dev-tips/).
* Added Security improvements:
	* [Single-user session token](https://github.com/mattermost/focalboard/commit/0fe96ad7ed3b0c3a68c9a5889b34b764782f9266)
	* [CSRF prevention with X-Requested-With header](https://github.com/mattermost/focalboard/commit/43c656c9a440e12f87b61d66654ed3d9873b1620)

