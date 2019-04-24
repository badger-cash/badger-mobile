# Redux Store

The redux store which holds all data which is application wide or benefits from caching.  
Should not hold application specific data such as the status of menus and modals to allow for easier sharing between multiple implementation of a Badger wallet. (web, mobile, extension, etc).

Data in reducers should always be `normalized` for consistency
Data should always be requested through `selectors` for maintainability
