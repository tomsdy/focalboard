package app

import (
	"fmt"

	"github.com/mattermost/focalboard/server/model"
)

const defaultCategoryBoards = "Boards"

func (a *App) GetUserCategoryBoards(userID, teamID string) ([]model.CategoryBoards, error) {
	categoryBoards, err := a.store.GetUserCategoryBoards(userID, teamID)
	if err != nil {
		return nil, err
	}

	createdCategoryBoards, err := a.createDefaultCategoriesIfRequired(categoryBoards, userID, teamID)
	if err != nil {
		return nil, err
	}

	categoryBoards = append(categoryBoards, createdCategoryBoards...)
	return categoryBoards, nil
}

func (a *App) createDefaultCategoriesIfRequired(existingCategoryBoards []model.CategoryBoards, userID, teamID string) ([]model.CategoryBoards, error) {
	createdCategories := []model.CategoryBoards{}

	boardsCategoryExist := false
	for _, categoryBoard := range existingCategoryBoards {
		if categoryBoard.Name == defaultCategoryBoards {
			boardsCategoryExist = true
		}
	}

	if !boardsCategoryExist {
		createdCategoryBoards, err := a.createBoardsCategory(userID, teamID, existingCategoryBoards)
		if err != nil {
			return nil, err
		}

		createdCategories = append(createdCategories, *createdCategoryBoards)
	}

	return createdCategories, nil
}

func (a *App) createBoardsCategory(userID, teamID string, existingCategoryBoards []model.CategoryBoards) (*model.CategoryBoards, error) {
	// create the category
	category := model.Category{
		Name:      defaultCategoryBoards,
		UserID:    userID,
		TeamID:    teamID,
		Collapsed: false,
		Type:      model.CategoryTypeSystem,
	}
	createdCategory, err := a.CreateCategory(&category)
	if err != nil {
		return nil, fmt.Errorf("createBoardsCategory default category creation failed: %w", err)
	}

	// once the category is created, we need to move all boards which do not
	// belong to any category, into this category.

	userBoards, err := a.GetBoardsForUserAndTeam(userID, teamID, false)
	if err != nil {
		return nil, fmt.Errorf("createBoardsCategory error fetching user's team's boards: %w", err)
	}

	createdCategoryBoards := &model.CategoryBoards{
		Category: *createdCategory,
		BoardIDs: []string{},
	}

	for _, board := range userBoards {
		belongsToCategory := false

		for _, categoryBoard := range existingCategoryBoards {
			for _, boardID := range categoryBoard.BoardIDs {
				if boardID == board.ID {
					belongsToCategory = true
					break
				}
			}

			// stop looking into other categories if
			// the board was found in a category
			if belongsToCategory {
				break
			}
		}

		if !belongsToCategory {
			if err := a.AddUpdateUserCategoryBoard(teamID, userID, createdCategory.ID, board.ID); err != nil {
				return nil, fmt.Errorf("createBoardsCategory failed to add category-less board to the default category, defaultCategoryID: %s, error: %w", createdCategory.ID, err)
			}

			createdCategoryBoards.BoardIDs = append(createdCategoryBoards.BoardIDs, board.ID)
		}
	}

	return createdCategoryBoards, nil
}

func (a *App) AddUpdateUserCategoryBoard(teamID, userID, categoryID, boardID string) error {
	err := a.store.AddUpdateCategoryBoard(userID, categoryID, boardID)
	if err != nil {
		return err
	}

	a.blockChangeNotifier.Enqueue(func() error {
		a.wsAdapter.BroadcastCategoryBoardChange(
			teamID,
			userID,
			model.BoardCategoryWebsocketData{
				BoardID:    boardID,
				CategoryID: categoryID,
			})
		return nil
	})

	return nil
}
