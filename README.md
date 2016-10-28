# ScumDB
ScumDB is a tool for managing database changes through your source code version control system.

It's a bit like a migration frame work, however:

* changes are SQL based - you dont need to learn a new syntax
* Database Version numbers are the same as mercurial (or git) revision Ids
* SProc and UDF definitions are checked in just like regular source code functions

## Usage ##

### Installation

```
npm install scumdb --save-dev
```
or
```
npm install scumdb --global
```

### Initialise scum
```
scum init
> Conection string lookup method - requires sa or ddladmin rights? (env)
> Connection string environment variable? (scumconnection)
> Directory to store database changes in? (./Database)
> Directory does not exist - create? (y)
> Pattern to match Stored Procedures (./Database/StoredProcedures/*.sql)
> Creating database structure and saving initial version [done]
> settings saved to scum.json [done]
```

### Create a new change/migration

```
scum create [changename]
```

This will create 2 new files: 
```
/Database/changes/changename-up.sql
/Database/changes/changename-down.sql
```
Then put in your required table creation, data migration or other DDL changes into the new script
and commit them to source control

### Apply outstanding changes

```
scum update
> current database version: 0
> preparing update to version: 1
> found: 1 change to upgrade: changename-up.sql 
> 0 changes to downgrade.
> 0 proc changes & 0 UDF changes.
> applying changes.
> done
```

### Apply a specific version
```
hg update 0
scum update
> current database version: 1
> preparing update to version: 0
> found: 0 changes to upgrade. 
> 1 change to downgrade: changename-down.sql
> 0 proc changes & 0 UDF changes.
> applying changes.
> done
```

### Advance usage/options

You may want to view the script before running - you can view that with:
```
scum script
```

Sometimes, for a particular migration you'll need to run UDF changes before DDL changes, other times you'll know you need them
to run afterwards. to do this, just name your migration with a suffix of -before or -after.
Before is the default, but this can be changed globally in scum.json