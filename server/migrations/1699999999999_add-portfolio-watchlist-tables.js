/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Create portfolios table
  pgm.createTable('portfolios', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true },
    description: { type: 'text' },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE'
    },
    is_public: { type: 'boolean', default: false },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Create portfolio_instruments junction table
  pgm.createTable('portfolio_instruments', {
    id: 'id',
    portfolio_id: {
      type: 'integer',
      notNull: true,
      references: 'portfolios',
      onDelete: 'CASCADE'
    },
    instrument_id: {
      type: 'integer',
      notNull: true,
      references: 'financial_instruments',
      onDelete: 'CASCADE'
    },
    added_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Create unique constraint to prevent duplicate instruments in a portfolio
  pgm.createConstraint(
    'portfolio_instruments',
    'portfolio_instruments_unique_constraint',
    {
      unique: ['portfolio_id', 'instrument_id']
    }
  );

  // Create watchlists table
  pgm.createTable('watchlists', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true },
    description: { type: 'text' },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE'
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Create watchlist_instruments junction table
  pgm.createTable('watchlist_instruments', {
    id: 'id',
    watchlist_id: {
      type: 'integer',
      notNull: true,
      references: 'watchlists',
      onDelete: 'CASCADE'
    },
    instrument_id: {
      type: 'integer',
      notNull: true,
      references: 'financial_instruments',
      onDelete: 'CASCADE'
    },
    added_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Create unique constraint to prevent duplicate instruments in a watchlist
  pgm.createConstraint(
    'watchlist_instruments',
    'watchlist_instruments_unique_constraint',
    {
      unique: ['watchlist_id', 'instrument_id']
    }
  );

  // Create comparison_groups table
  pgm.createTable('comparison_groups', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE'
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Create comparison_group_instruments junction table
  pgm.createTable('comparison_group_instruments', {
    id: 'id',
    comparison_group_id: {
      type: 'integer',
      notNull: true,
      references: 'comparison_groups',
      onDelete: 'CASCADE'
    },
    instrument_id: {
      type: 'integer',
      notNull: true,
      references: 'financial_instruments',
      onDelete: 'CASCADE'
    },
    added_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Create unique constraint to prevent duplicate instruments in a comparison group
  pgm.createConstraint(
    'comparison_group_instruments',
    'comparison_group_instruments_unique_constraint',
    {
      unique: ['comparison_group_id', 'instrument_id']
    }
  );
};

exports.down = pgm => {
  // Drop tables in reverse order
  pgm.dropTable('comparison_group_instruments');
  pgm.dropTable('comparison_groups');
  pgm.dropTable('watchlist_instruments');
  pgm.dropTable('watchlists');
  pgm.dropTable('portfolio_instruments');
  pgm.dropTable('portfolios');
}; 