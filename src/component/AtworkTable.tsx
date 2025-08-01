import { useState, useEffect, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

export default function ArtworkTable() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedRowsMap, setSelectedRowsMap] = useState<{ [key: number]: Artwork }>({});
  const [page, setPage] = useState(1);
  const [first, setFirst] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const op = useRef<OverlayPanel | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pageSize = 12;

  const fetchArtworks = useCallback(async (pageNum: number): Promise<Artwork[]> => {
    const res = await fetch(`https://api.artic.edu/api/v1/artworks?page=${pageNum}&limit=${pageSize}`);
    const data = await res.json();

    const formatted: Artwork[] = data.data.map((item: any) => ({
      id: item.id,
      title: item.title,
      place_of_origin: item.place_of_origin,
      artist_display: item.artist_display,
      inscriptions: item.inscriptions,
      date_start: item.date_start,
      date_end: item.date_end,
    }));

    if (pageNum === 1) {
      setTotalRecords(data.pagination.total);
    }

    return formatted;
  }, []);

  const loadPage = async (pageNum: number) => {
    const data = await fetchArtworks(pageNum);
    setArtworks(data);
  };

  useEffect(() => {
    loadPage(page);
  }, [page]);

  const handlePageChange = (e: any) => {
    setPage(e.page + 1);
    setFirst(e.first);
  };

  const handleSelectionChange = (e: any) => {
    const newSelectedArray = e.value as Artwork[];

    // Update global selection map
    const updated = { ...selectedRowsMap };
    artworks.forEach((item) => {
      if (newSelectedArray.find((row) => row.id === item.id)) {
        updated[item.id] = item;
      } else {
        delete updated[item.id];
      }
    });

    setSelectedRowsMap(updated);
  };

  const currentPageSelection = artworks.filter((item) => selectedRowsMap[item.id]);

  const handleChevronClick = (e: any) => {
    op.current?.toggle(e);
  };

  const handleSubmit = async () => {
    const numRows = parseInt(inputRef.current?.value || "0", 10);
    if (!numRows || numRows <= 0) return;

    const totalPages = Math.ceil(numRows / pageSize);
    const newSelectedMap: { [key: number]: Artwork } = {};

    for (let i = 1; i <= totalPages; i++) {
      const data = await fetchArtworks(i);
      for (let item of data) {
        if (Object.keys(newSelectedMap).length < numRows) {
          newSelectedMap[item.id] = item;
        } else {
          break;
        }
      }
      if (Object.keys(newSelectedMap).length >= numRows) break;
    }

    setSelectedRowsMap(newSelectedMap);
    loadPage(page); // Refresh current page to reflect updated selection
    op.current?.hide();
  };

  const headerCheckboxTemplate = (options: any) => (
    <div className="flex items-center gap-2">
      {options.checkboxElement}
      <Button
        icon="pi pi-chevron-down"
        className="p-button-text p-0"
        onClick={handleChevronClick}
        aria-label="Open Overlay"
      />
    </div>
  );

  return (
    <div className="card p-4">
      <DataTable
        value={artworks}
        tableStyle={{ minWidth: "50rem" }}
        paginator
        rows={pageSize}
        first={first}
        lazy
        totalRecords={totalRecords}
        onPage={handlePageChange}
        selection={currentPageSelection}
        onSelectionChange={handleSelectionChange}
        dataKey="id"
         selectionMode="multiple"
      >
        <Column selectionMode="multiple"  headerStyle={{ width: "4rem" }} />
        <Column header={headerCheckboxTemplate}></Column>
        <Column field="id" header="ID" />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist Display" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Year" />
        <Column field="date_end" header="End Year" />
      </DataTable>

      <OverlayPanel ref={op}>
        <div className="p-3 min-w-[200px]">
          <input
            ref={inputRef}
            type="number"
            placeholder="Enter number of rows"
            name="rows"
            className="p-inputtext p-component w-full mb-2"
          />
          <br />
          <Button label="Submit" onClick={handleSubmit} className="w-full black" />
        </div>
      </OverlayPanel>
    </div>
  );
}
