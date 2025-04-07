"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Database as DatabaseIcon,
  Download, 
  Trash2, 
  RefreshCw, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  X,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  FolderOpen,
  FolderClosed,
  Trash,
  Table as TableIcon
} from "lucide-react";
import { openDB, IDBPDatabase } from 'idb';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// Define the vocabulary item interface
interface VocabularyItem {
  id?: number;
  word: string;
  translation: string;
  example: string;
  language_id: string;
  difficulty: string;
}

// Define the database schema
interface DatabaseSchema {
  vocabulary: {
    key: number;
    value: VocabularyItem;
    indexes: {
      'by-language': string;
      'by-difficulty': string;
    };
  };
}

// Language options
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
];

// Difficulty options
const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// Define database types
interface DatabaseInfo {
  name: string;
  version: number;
  tables: string[];
}

export default function DatabasePage() {
  // Database state
  const [db, setDb] = useState<IDBPDatabase<any> | undefined>(undefined);
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<any[]>([]);
  const [availableDatabases, setAvailableDatabases] = useState<DatabaseInfo[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [discoveringDatabases, setDiscoveringDatabases] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedTables, setExpandedTables] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  
  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState<any>({});

  // Discover available databases on component mount
  useEffect(() => {
    discoverDatabases();
  }, []);

  // Initialize database connection when selected database changes
  useEffect(() => {
    if (selectedDatabase) {
      initializeDB(selectedDatabase);
    }
  }, [selectedDatabase]);

  // Load table data when selected table changes
  useEffect(() => {
    if (db && selectedTable) {
      loadTableData(db, selectedTable);
    }
  }, [db, selectedTable]);

  // Function to discover all available IndexedDB databases
  const discoverDatabases = async () => {
    try {
      setDiscoveringDatabases(true);
      
      // Get all databases from the browser
      const databases = await window.indexedDB.databases();
      
      // Convert to our DatabaseInfo format
      const discoveredDatabases: DatabaseInfo[] = await Promise.all(
        databases
          .filter((db): db is { name: string; version: number } => 
            db.name !== undefined && db.version !== undefined
          )
          .map(async (db) => {
            try {
              // Try to open the database to get its tables
              const database = await openDB(db.name, db.version, {
                upgrade(db) {
                  // This will be called if the database doesn't exist
                  // We don't need to do anything here
                },
                blocked() {
                  // This will be called if the database is blocked
                  console.warn(`Database ${db.name} is blocked`);
                },
                blocking() {
                  // This will be called if the database is blocking
                  console.warn(`Database ${db.name} is blocking`);
                },
              });
              
              // Get all object store names (tables)
              const tables = Array.from(database.objectStoreNames);
              
              return {
                name: db.name,
                version: db.version,
                tables
              };
            } catch (error) {
              console.error(`Error opening database ${db.name}:`, error);
              // Return a database info with empty tables if we can't open it
              return {
                name: db.name,
                version: db.version,
                tables: []
              };
            }
          })
      );
      
      setAvailableDatabases(discoveredDatabases);
      
      // Auto-select the first database if available
      if (discoveredDatabases.length > 0) {
        setSelectedDatabase(discoveredDatabases[0].name);
      }
    } catch (error) {
      console.error("Error discovering databases:", error);
      toast.error("Failed to discover databases");
    } finally {
      setDiscoveringDatabases(false);
    }
  };

  const initializeDB = async (dbName: string) => {
    try {
      setLoading(true);
      setTableData([]);
      setSelectedTable("");
      
      // Find database info
      const dbInfo = availableDatabases.find(db => db.name === dbName);
      if (!dbInfo) {
        throw new Error(`Database ${dbName} not found`);
      }
      setDbInfo(dbInfo);
      
      // Initialize database
      let database: IDBPDatabase<any> | undefined;
      
      try {
        // Try to open the database
        database = await openDB(dbName, dbInfo.version, {
          upgrade(db) {
            // This will be called if the database doesn't exist
            // We don't need to do anything here
          },
          blocked() {
            // This will be called if the database is blocked
            console.warn(`Database ${dbName} is blocked`);
          },
          blocking() {
            // This will be called if the database is blocking
            console.warn(`Database ${dbName} is blocking`);
          },
        });
      } catch (error) {
        console.error(`Error opening database ${dbName}:`, error);
        throw error;
      }
      
      if (database) {
        setDb(database);
        
        // Check which tables actually exist in the database
        const existingTables = Array.from(database.objectStoreNames);
        const availableTables = dbInfo.tables.filter(table => existingTables.includes(table));
        
        // Update the database info with only existing tables
        if (availableTables.length > 0) {
          setDbInfo({
            ...dbInfo,
            tables: availableTables
          });
          
          // Auto-select first available table
          setSelectedTable(availableTables[0]);
        } else {
          toast.warning(`No tables found in database "${dbName}". The database may need to be initialized.`);
        }
      }
    } catch (error) {
      console.error(`Error initializing database ${dbName}:`, error);
      toast.error(`Failed to initialize database ${dbName}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (database: IDBPDatabase<any>, tableName: string) => {
    try {
      setLoading(true);
      
      // Check if the object store exists
      if (!database.objectStoreNames.contains(tableName)) {
        console.warn(`Object store "${tableName}" does not exist in database "${selectedDatabase}"`);
        setTableData([]);
        return;
      }
      
      const items = await database.getAll(tableName);
      setTableData(items);
      
      // Set default sort field based on table
      if (tableName === "vocabulary") {
        setSortField("word");
      } else {
        setSortField("id");
      }
    } catch (error) {
      console.error(`Error loading data from ${tableName}:`, error);
      toast.error(`Failed to load data from ${tableName}`);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!db || !selectedTable) return;

    try {
      await db.add(selectedTable, newItem);
      await loadTableData(db, selectedTable);
      setIsAddDialogOpen(false);
      setNewItem({});
      toast.success(`Item added to ${selectedTable} successfully`);
    } catch (error) {
      console.error(`Error adding item to ${selectedTable}:`, error);
      toast.error(`Failed to add item to ${selectedTable}`);
    }
  };

  const handleEditItem = async () => {
    if (!db || !selectedTable || !editingItem?.id) return;

    try {
      await db.put(selectedTable, editingItem);
      await loadTableData(db, selectedTable);
      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast.success(`Item updated in ${selectedTable} successfully`);
    } catch (error) {
      console.error(`Error updating item in ${selectedTable}:`, error);
      toast.error(`Failed to update item in ${selectedTable}`);
    }
  };

  const handleDeleteItem = async (id: number | string) => {
    if (!db || !selectedTable) return;

    try {
      await db.delete(selectedTable, id);
      await loadTableData(db, selectedTable);
      toast.success(`Item deleted from ${selectedTable} successfully`);
    } catch (error) {
      console.error(`Error deleting item from ${selectedTable}:`, error);
      toast.error(`Failed to delete item from ${selectedTable}`);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(tableData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `${selectedDatabase}-${selectedTable}-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const toggleTableExpansion = (tableName: string) => {
    if (expandedTables.includes(tableName)) {
      setExpandedTables(expandedTables.filter(t => t !== tableName));
    } else {
      setExpandedTables([...expandedTables, tableName]);
    }
  };

  // Filter and sort data
  const filteredData = tableData
    .filter(item => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchLower)
        );
      }
      
      // Language filter for vocabulary table
      if (selectedTable === "vocabulary" && selectedLanguage !== "all") {
        return item.language_id === selectedLanguage;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

  // Get column headers based on table data
  const getTableColumns = () => {
    if (tableData.length === 0) return [];
    
    return Object.keys(tableData[0]);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DatabaseIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Database Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select database" />
            </SelectTrigger>
            <SelectContent>
              {availableDatabases.map((db) => (
                <SelectItem key={db.name} value={db.name}>
                  {db.name} (v{db.version})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={discoverDatabases}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!selectedTable || tableData.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Database Explorer Sidebar */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Database Explorer</CardTitle>
            <CardDescription>
              Browse databases and tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            {discoveringDatabases ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Discovering databases...</span>
              </div>
            ) : availableDatabases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DatabaseIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No databases found</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={discoverDatabases}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {availableDatabases.map((dbInfo) => (
                  <div key={dbInfo.name} className="space-y-1">
                    <div 
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${
                        selectedDatabase === dbInfo.name ? "bg-muted" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedDatabase(dbInfo.name)}
                    >
                      {selectedDatabase === dbInfo.name ? (
                        <FolderOpen className="h-4 w-4" />
                      ) : (
                        <FolderClosed className="h-4 w-4" />
                      )}
                      <span className="font-medium">{dbInfo.name}</span>
                      <Badge variant="outline" className="ml-auto">v{dbInfo.version}</Badge>
                    </div>
                    
                    {selectedDatabase === dbInfo.name && (
                      <div className="pl-6 space-y-1">
                        {dbInfo.tables.length > 0 ? (
                          dbInfo.tables.map((table) => (
                            <div 
                              key={table}
                              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${
                                selectedTable === table ? "bg-muted" : "hover:bg-muted/50"
                              }`}
                              onClick={() => setSelectedTable(table)}
                            >
                              <TableIcon className="h-4 w-4" />
                              <span>{table}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground p-2">
                            No tables available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="col-span-9 space-y-6">
          {selectedTable ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedTable}</CardTitle>
                  <CardDescription>
                    {filteredData.length} of {tableData.length} items
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  {selectedTable === "vocabulary" && (
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Languages</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="ru">Russian</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-8">Loading data...</div>
                ) : tableData.length === 0 ? (
                  <div className="text-center py-8">No data found in this table.</div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {getTableColumns().map((column) => (
                            <TableHead 
                              key={column}
                              className="cursor-pointer"
                              onClick={() => {
                                if (sortField === column) {
                                  setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                                } else {
                                  setSortField(column);
                                  setSortDirection("asc");
                                }
                              }}
                            >
                              <div className="flex items-center">
                                {column}
                                {sortField === column && (
                                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                                )}
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((item, index) => (
                          <TableRow key={item.id || index}>
                            {getTableColumns().map((column) => (
                              <TableCell key={column}>
                                {typeof item[column] === 'object' 
                                  ? JSON.stringify(item[column]) 
                                  : String(item[column])}
                              </TableCell>
                            ))}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => item.id && handleDeleteItem(item.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Select a Table</CardTitle>
                <CardDescription>
                  Choose a table from the database explorer to view its contents.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <TableIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No table selected</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to {selectedTable}</DialogTitle>
            <DialogDescription>
              Add a new item to the {selectedTable} table.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedTable === "vocabulary" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="word">Word</Label>
                  <Input
                    id="word"
                    value={newItem.word || ""}
                    onChange={(e) => setNewItem({ ...newItem, word: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="translation">Translation</Label>
                  <Input
                    id="translation"
                    value={newItem.translation || ""}
                    onChange={(e) => setNewItem({ ...newItem, translation: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="example">Example</Label>
                  <Textarea
                    id="example"
                    value={newItem.example || ""}
                    onChange={(e) => setNewItem({ ...newItem, example: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={newItem.difficulty || "medium"}
                    onValueChange={(value) => setNewItem({ ...newItem, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={newItem.language_id || "en"}
                    onValueChange={(value) => setNewItem({ ...newItem, language_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="json-data">JSON Data</Label>
                <Textarea
                  id="json-data"
                  value={JSON.stringify(newItem, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setNewItem(parsed);
                    } catch (error) {
                      // Invalid JSON, keep the string as is
                    }
                  }}
                  className="font-mono h-48"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item in {selectedTable}</DialogTitle>
            <DialogDescription>
              Edit the item details.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              {selectedTable === "vocabulary" ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-word">Word</Label>
                    <Input
                      id="edit-word"
                      value={editingItem.word || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, word: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-translation">Translation</Label>
                    <Input
                      id="edit-translation"
                      value={editingItem.translation || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, translation: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-example">Example</Label>
                    <Textarea
                      id="edit-example"
                      value={editingItem.example || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, example: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-difficulty">Difficulty</Label>
                    <Select
                      value={editingItem.difficulty || "medium"}
                      onValueChange={(value) => setEditingItem({ ...editingItem, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-language">Language</Label>
                    <Select
                      value={editingItem.language_id || "en"}
                      onValueChange={(value) => setEditingItem({ ...editingItem, language_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="ru">Russian</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="edit-json-data">JSON Data</Label>
                  <Textarea
                    id="edit-json-data"
                    value={JSON.stringify(editingItem, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setEditingItem(parsed);
                      } catch (error) {
                        // Invalid JSON, keep the string as is
                      }
                    }}
                    className="font-mono h-48"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 