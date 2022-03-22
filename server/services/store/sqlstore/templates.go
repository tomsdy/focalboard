package sqlstore

import (
	"errors"
	"fmt"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

var (
	ErrUnsupportedDatabaseType = errors.New("database type is unsupported")
)

// removeDefaultTemplates deletes all the default templates and their children.
func (s *SQLStore) removeDefaultTemplates(db sq.BaseRunner, boards []*model.Board) error {
	count := 0
	for _, board := range boards {
		if board.CreatedBy != "system" {
			continue
		}
		// default template deletion does not need to go to blocks_history
		deleteQuery := s.getQueryBuilder(db).
			Delete(s.tablePrefix + "boards").
			Where(sq.Eq{"id": board.ID}).
			Where(sq.Eq{"is_template": true})

		if _, err := deleteQuery.Exec(); err != nil {
			return fmt.Errorf("cannot delete default template %s: %w", board.ID, err)
		}

		deleteQuery = s.getQueryBuilder(db).
			Delete(s.tablePrefix + "blocks").
			Where(sq.Or{
				sq.Eq{"parent_id": board.ID},
				sq.Eq{"root_id": board.ID},
				sq.Eq{"board_id": board.ID},
			})

		if _, err := deleteQuery.Exec(); err != nil {
			return fmt.Errorf("cannot delete default template %s: %w", board.ID, err)
		}

		s.logger.Trace("removed default template block",
			mlog.String("board_id", board.ID),
		)
		count++
	}

	s.logger.Debug("Removed default templates", mlog.Int("count", count))

	return nil
}

// getDefaultTemplateBoards fetches all template blocks .
func (s *SQLStore) getTemplateBoards(db sq.BaseRunner, teamID string) ([]*model.Board, error) {
	query := s.getQueryBuilder(db).
		Select(boardFields("")...).
		From(s.tablePrefix + "boards").
		Where(sq.Eq{"coalesce(team_id, '0')": teamID}).
		Where(sq.Eq{"is_template": true})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`getTemplateBoards ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	return s.boardsFromRows(rows)
}
