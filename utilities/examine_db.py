import couchdb

if __name__ == "__main__":

    db = couchdb.Server()

    print dir(db)
    for coll in db:
        print coll
        for tmp in db[coll]:
            print tmp
