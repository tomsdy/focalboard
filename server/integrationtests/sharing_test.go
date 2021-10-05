package integrationtests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/require"
)

func TestSharing(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	rootID := utils.NewID(utils.IDTypeBlock)
	token := utils.NewID(utils.IDTypeToken)

	t.Run("Check no initial sharing", func(t *testing.T) {
		sharing, resp := th.Client.GetSharing(rootID)
		require.NoError(t, resp.Error)
		require.Empty(t, sharing.ID)
		require.False(t, sharing.Enabled)
	})

	t.Run("POST sharing", func(t *testing.T) {
		sharing := model.Sharing{
			ID:       rootID,
			Token:    token,
			Enabled:  true,
			UpdateAt: 1,
		}

		success, resp := th.Client.PostSharing(sharing)
		require.True(t, success)
		require.NoError(t, resp.Error)
	})

	t.Run("GET sharing", func(t *testing.T) {
		sharing, resp := th.Client.GetSharing(rootID)
		require.NoError(t, resp.Error)
		require.NotNil(t, sharing)
		require.Equal(t, sharing.ID, rootID)
		require.True(t, sharing.Enabled)
		require.Equal(t, sharing.Token, token)
	})
}
