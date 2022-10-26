package app

import (
	"testing"

	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/focalboard/server/model"
	"github.com/stretchr/testify/assert"
)

func TestGetUserCategoryBoards(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("user had no default category and had boards", func(t *testing.T) {
		th.Store.EXPECT().GetUserCategoryBoards("user_id", "team_id").Return([]model.CategoryBoards{}, nil)
		th.Store.EXPECT().CreateCategory(utils.Anything).Return(nil)
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:   "boards_category_id",
			Name: "Boards",
		}, nil)

		board1 := &model.Board{
			ID: "board_id_1",
		}

		board2 := &model.Board{
			ID: "board_id_2",
		}

		board3 := &model.Board{
			ID: "board_id_3",
		}

		th.Store.EXPECT().GetBoardsForUserAndTeam("user_id", "team_id", false).Return([]*model.Board{board1, board2, board3}, nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id", "boards_category_id", "board_id_1").Return(nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id", "boards_category_id", "board_id_2").Return(nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id", "boards_category_id", "board_id_3").Return(nil)

		categoryBoards, err := th.App.GetUserCategoryBoards("user_id", "team_id")
		assert.NoError(t, err)
		assert.Equal(t, 1, len(categoryBoards))
		assert.Equal(t, "Boards", categoryBoards[0].Name)
		assert.Equal(t, 3, len(categoryBoards[0].BoardIDs))
		assert.Contains(t, categoryBoards[0].BoardIDs, "board_id_1")
		assert.Contains(t, categoryBoards[0].BoardIDs, "board_id_2")
		assert.Contains(t, categoryBoards[0].BoardIDs, "board_id_3")
	})

	t.Run("user had no default category BUT had no boards", func(t *testing.T) {
		th.Store.EXPECT().GetUserCategoryBoards("user_id", "team_id").Return([]model.CategoryBoards{}, nil)
		th.Store.EXPECT().CreateCategory(utils.Anything).Return(nil)
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:   "boards_category_id",
			Name: "Boards",
		}, nil)

		th.Store.EXPECT().GetBoardsForUserAndTeam("user_id", "team_id", false).Return([]*model.Board{}, nil)

		categoryBoards, err := th.App.GetUserCategoryBoards("user_id", "team_id")
		assert.NoError(t, err)
		assert.Equal(t, 1, len(categoryBoards))
		assert.Equal(t, "Boards", categoryBoards[0].Name)
		assert.Equal(t, 0, len(categoryBoards[0].BoardIDs))
	})

	t.Run("user already had a default Boards category with boards in it", func(t *testing.T) {
		th.Store.EXPECT().GetUserCategoryBoards("user_id", "team_id").Return([]model.CategoryBoards{
			{
				Category: model.Category{Name: "Boards"},
				BoardIDs: []string{"board_id_1", "board_id_2"},
			},
		}, nil)

		categoryBoards, err := th.App.GetUserCategoryBoards("user_id", "team_id")
		assert.NoError(t, err)
		assert.Equal(t, 1, len(categoryBoards))
		assert.Equal(t, "Boards", categoryBoards[0].Name)
		assert.Equal(t, 2, len(categoryBoards[0].BoardIDs))
	})
}
