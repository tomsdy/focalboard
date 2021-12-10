package model

import (
	"encoding/json"
	"io"

	"github.com/mattermost/focalboard/server/utils"
)

// Block is the basic data unit
// swagger:model
type Block struct {
	// The id for this block
	// required: true
	ID string `json:"id"`

	// The id for this block's parent block. Empty for root blocks
	// required: false
	ParentID string `json:"parentId"`

	// The id for this block's root block
	// required: true
	RootID string `json:"rootId"`

	// The id for user who created this block
	// required: true
	CreatedBy string `json:"createdBy"`

	// The id for user who last modified this block
	// required: true
	ModifiedBy string `json:"modifiedBy"`

	// The schema version of this block
	// required: true
	Schema int64 `json:"schema"`

	// The block type
	// required: true
	Type BlockType `json:"type"`

	// The display title
	// required: false
	Title string `json:"title"`

	// The block fields
	// required: false
	Fields map[string]interface{} `json:"fields"`

	// The creation time
	// required: true
	CreateAt int64 `json:"createAt"`

	// The last modified time
	// required: true
	UpdateAt int64 `json:"updateAt"`

	// The deleted time. Set to indicate this block is deleted
	// required: false
	DeleteAt int64 `json:"deleteAt"`

	// The workspace id that the block belongs to
	// required: true
	WorkspaceID string `json:"workspaceId"`
}

// BlockPatch is a patch for modify blocks
// swagger:model
type BlockPatch struct {
	// The id for this block's parent block. Empty for root blocks
	// required: false
	ParentID *string `json:"parentId"`

	// The id for this block's root block
	// required: false
	RootID *string `json:"rootId"`

	// The schema version of this block
	// required: false
	Schema *int64 `json:"schema"`

	// The block type
	// required: false
	Type *BlockType `json:"type"`

	// The display title
	// required: false
	Title *string `json:"title"`

	// The block updated fields
	// required: false
	UpdatedFields map[string]interface{} `json:"updatedFields"`

	// The block removed fields
	// required: false
	DeletedFields []string `json:"deletedFields"`
}

// BlockPatchBatch is a batch of IDs and patches for modify blocks
// swagger:model
type BlockPatchBatch struct {
	// The id's for of the blocks to patch
	BlockIDs []string `json:"block_ids"`

	// The BlockPatches to be applied
	BlockPatches []BlockPatch `json:"block_patches"`
}

// Archive is an import / export archive.
type Archive struct {
	Version int64   `json:"version"`
	Date    int64   `json:"date"`
	Blocks  []Block `json:"blocks"`
}

func BlocksFromJSON(data io.Reader) []Block {
	var blocks []Block
	_ = json.NewDecoder(data).Decode(&blocks)
	return blocks
}

// LogClone implements the `mlog.LogCloner` interface to provide a subset of Block fields for logging.
func (b Block) LogClone() interface{} {
	return struct {
		ID       string
		ParentID string
		RootID   string
		Type     BlockType
	}{
		ID:       b.ID,
		ParentID: b.ParentID,
		RootID:   b.RootID,
		Type:     b.Type,
	}
}

// Patch returns an update version of the block.
func (p *BlockPatch) Patch(block *Block) *Block {
	if p.ParentID != nil {
		block.ParentID = *p.ParentID
	}

	if p.RootID != nil {
		block.RootID = *p.RootID
	}

	if p.Schema != nil {
		block.Schema = *p.Schema
	}

	if p.Type != nil {
		block.Type = *p.Type
	}

	if p.Title != nil {
		block.Title = *p.Title
	}

	for key, field := range p.UpdatedFields {
		block.Fields[key] = field
	}

	for _, key := range p.DeletedFields {
		delete(block.Fields, key)
	}

	return block
}

// QuerySubtreeOptions are query options that can be passed to GetSubTree methods.
type QuerySubtreeOptions struct {
	BeforeUpdateAt int64  // if non-zero then filter for records with update_at less than BeforeUpdateAt
	AfterUpdateAt  int64  // if non-zero then filter for records with update_at greater than AfterUpdateAt
	Limit          uint64 // if non-zero then limit the number of returned records
}

// QueryBlockHistoryOptions are query options that can be passed to GetBlockHistory.
type QueryBlockHistoryOptions struct {
	BeforeUpdateAt int64  // if non-zero then filter for records with update_at less than BeforeUpdateAt
	AfterUpdateAt  int64  // if non-zero then filter for records with update_at greater than AfterUpdateAt
	Limit          uint64 // if non-zero then limit the number of returned records
	Descending     bool   // if true then the records are sorted by insert_at in descending order
}

// GenerateBlockIDs generates new IDs for all the blocks of the list,
// keeping consistent any references that other blocks would made to
// the original IDs, so a tree of blocks can get new IDs and maintain
// its shape.
func GenerateBlockIDs(blocks []Block) []Block {
	blockIDs := map[string]BlockType{}
	referenceIDs := map[string]bool{}
	for _, block := range blocks {
		if _, ok := blockIDs[block.ID]; !ok {
			blockIDs[block.ID] = block.Type
		}

		if _, ok := referenceIDs[block.RootID]; !ok {
			referenceIDs[block.RootID] = true
		}
		if _, ok := referenceIDs[block.ParentID]; !ok {
			referenceIDs[block.ParentID] = true
		}
	}

	newIDs := map[string]string{}
	for id, blockType := range blockIDs {
		for referenceID := range referenceIDs {
			if id == referenceID {
				newIDs[id] = utils.NewID(BlockType2IDType(blockType))
				continue
			}
		}
	}

	getExistingOrOldID := func(id string) string {
		if existingID, ok := newIDs[id]; ok {
			return existingID
		}
		return id
	}

	getExistingOrNewID := func(id string) string {
		if existingID, ok := newIDs[id]; ok {
			return existingID
		}
		return utils.NewID(BlockType2IDType(blockIDs[id]))
	}

	newBlocks := make([]Block, len(blocks))
	for i, block := range blocks {
		block.ID = getExistingOrNewID(block.ID)
		block.RootID = getExistingOrOldID(block.RootID)
		block.ParentID = getExistingOrOldID(block.ParentID)

		newBlocks[i] = block
	}

	return newBlocks
}
