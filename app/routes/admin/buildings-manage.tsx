import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
    Building2,
    Plus,
    ArrowLeft,
    Layers,
    Hash,
    Bed,
    Pencil,
    Trash2,
    AlertCircle,
    CheckSquare,
    Square,
    X,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "~/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "~/components/ui/alert-dialog";

import {
    useBuildingById,
    useBuildingLayout,
    useAddFloor,
    useAddRoom,
    useUpdateRoom,
    useUpdateBed,
    useDeleteBed,
    useUpdateFloor,
    useAddSeat,
    useDeleteRoom,
    useBulkDeleteSeats,
} from "~/queries/buildings.query";
import { useRoomTypes, useSharingTypes } from "~/queries/room-types.query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useAuthStore } from "~/store/auth.store";

export default function ManageBuildingLayout() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Permission Check
    const canManage = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

    const [openFloor, setOpenFloor] = useState(false);
    const [openRoom, setOpenRoom] = useState(false);
    const [openEditRoom, setOpenEditRoom] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [openEditBed, setOpenEditBed] = useState(false);
    const [selectedBed, setSelectedBed] = useState<any>(null);
    const [newBedNum, setNewBedNum] = useState("");

    // Edit Floor states
    const [openEditFloor, setOpenEditFloor] = useState(false);
    const [editFloorId, setEditFloorId] = useState<string | null>(null);
    const [editFloorNum, setEditFloorNum] = useState("");

    // Add Seat states
    const [openAddSeat, setOpenAddSeat] = useState(false);
    const [addSeatRoomId, setAddSeatRoomId] = useState<string | null>(null);
    const [newSeatNum, setNewSeatNum] = useState("");

    // Selection states
    const [selectionModeRoomId, setSelectionModeRoomId] = useState<string | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<Record<string, Set<string>>>({});
    const [roomToDelete, setRoomToDelete] = useState<any | null>(null);

    const [newFloorNum, setNewFloorNum] = useState("");
    const [newRoomCount, setNewRoomCount] = useState("0");
    const [newBedsPerRoom, setNewBedsPerRoom] = useState("0");

    const [newRoomNum, setNewRoomNum] = useState("");
    const [seatsInRoom, setSeatsInRoom] = useState("4");
    const [selectedRoomType, setSelectedRoomType] = useState<string>("");
    const [selectedSharingType, setSelectedSharingType] = useState<string>("");

    // Queries
    const { data: building, isLoading: loadingBuilding } = useBuildingById({
        variables: { buildingId: id || "" },
        enabled: !!id,
    });

    const { data: floors = [], isLoading: loadingFloors } = useBuildingLayout({
        variables: { buildingId: id || "" },
        enabled: !!id,
    });

    const { data: roomTypes = [] } = useRoomTypes();
    const { data: sharingTypes = [] } = useSharingTypes();

    const loading = loadingBuilding || loadingFloors;

    // Mutations
    const { mutateAsync: addFloorMutation } = useAddFloor();
    const { mutateAsync: addRoomMutation } = useAddRoom();
    const { mutateAsync: updateRoomMutation } = useUpdateRoom();
    const { mutateAsync: updateBedMutation } = useUpdateBed();
    const { mutateAsync: deleteBedMutation } = useDeleteBed();
    const { mutateAsync: updateFloorMutation } = useUpdateFloor();
    const { mutateAsync: addSeatMutation } = useAddSeat();
    const { mutateAsync: deleteRoomMutation } = useDeleteRoom();
    const { mutateAsync: bulkDeleteSeatsMutation } = useBulkDeleteSeats();

    const addFloor = async () => {
        if (!newFloorNum || !id) return;
        try {
            await addFloorMutation({
                buildingId: id,
                floorNumber: newFloorNum,
                roomCount: Number(newRoomCount),
                bedsPerRoom: Number(newBedsPerRoom),
            });
            toast.success("Floor and layout created!");
            setOpenFloor(false);
            setNewFloorNum("");
            setNewRoomCount("0");
            setNewBedsPerRoom("0");
        } catch (e: any) {
            toast.error(e.message || "Failed to add floor");
        }
    };

    const onAddRoom = async () => {
        if (!newRoomNum || !selectedFloor) return;
        try {
            await addRoomMutation({
                floorId: selectedFloor,
                roomNumber: newRoomNum,
                totalSeats: Number(seatsInRoom),
                roomTypeId: selectedRoomType || undefined,
                sharingTypeId: selectedSharingType || undefined,
            });

            toast.success("Flat and beds added!");
            setOpenRoom(false);
            setNewRoomNum("");
            setSelectedRoomType("");
            setSelectedSharingType("");
        } catch (e: any) {
            toast.error(e.message || "Failed to add flat");
        }
    };

    const handleEditRoomSubmit = async () => {
        if (!selectedRoomId) return;
        try {
            await updateRoomMutation({
                roomId: selectedRoomId,
                roomNumber: newRoomNum,
                totalSeats: Number(seatsInRoom),
                roomTypeId: selectedRoomType || undefined,
                sharingTypeId: selectedSharingType || undefined,
            });
            toast.success("Flat updated successfully!");
            setOpenEditRoom(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to edit flat");
        }
    };

    const openAppEditRoom = (room: any) => {
        setSelectedRoomId(room.id);
        setNewRoomNum(room.room_number);
        setSelectedRoomType(room.room_type_id || "");
        setSelectedSharingType(room.sharing_type_id || "");
        setSeatsInRoom(String(room.total_seats || 4));
        setOpenEditRoom(true);
    };

    const openEditBedModal = (bed: any) => {
        setSelectedBed(bed);
        setNewBedNum(bed.seat_number);
        setOpenEditBed(true);
    };

    const handleEditBed = async () => {
        if (!selectedBed) return;
        try {
            await updateBedMutation({ id: selectedBed.id, seat_number: newBedNum });
            toast.success("Bed number updated!");
            setOpenEditBed(false);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleDeleteBed = async (id: string, fromModal: boolean = false) => {
        if (!confirm("Are you sure you want to delete this bed?")) return;
        try {
            await deleteBedMutation(id);
            toast.success("Bed deleted!");
            if (fromModal) {
                setOpenEditBed(false);
            }
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // Selection Logic
    const toggleSeatSelection = (roomId: string, seatId: string, isOccupied: boolean) => {
        if (isOccupied) {
            toast.error("This bed is occupied and cannot be selected");
            return;
        }

        setSelectedSeats((prev) => {
            const roomSelection = new Set(prev[roomId] || []);
            if (roomSelection.has(seatId)) roomSelection.delete(seatId);
            else roomSelection.add(seatId);
            return { ...prev, [roomId]: roomSelection };
        });
    };

    const toggleSelectAll = (room: any) => {
        const selectableSeatIds = room.seats?.filter((s: any) => s.status === "AVAILABLE").map((s: any) => s.id) || [];

        setSelectedSeats((prev) => {
            const currentSelection = prev[room.id] || new Set();
            const allSelected =
                selectableSeatIds.length > 0 && selectableSeatIds.every((id) => currentSelection.has(id));

            const newSelection = new Set(currentSelection);
            if (allSelected) {
                selectableSeatIds.forEach((id) => newSelection.delete(id));
            } else {
                selectableSeatIds.forEach((id) => newSelection.add(id));
            }
            return { ...prev, [room.id]: newSelection };
        });
    };

    const handleBulkDelete = async (roomId: string) => {
        const seatIds = Array.from(selectedSeats[roomId] || []);
        if (seatIds.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${seatIds.length} selected beds?`)) return;

        try {
            await bulkDeleteSeatsMutation({ roomId, seatIds });
            toast.success(`${seatIds.length} beds deleted successfully`);
            setSelectedSeats((prev) => {
                const next = { ...prev };
                delete next[roomId];
                return next;
            });
            setSelectionModeRoomId(null);
        } catch (e: any) {
            toast.error(e.message || "Failed to delete beds");
        }
    };

    const exitSelectionMode = (roomId: string) => {
        setSelectionModeRoomId(null);
        setSelectedSeats((prev) => {
            const next = { ...prev };
            delete next[roomId];
            return next;
        });
    };

    // Edit Floor handlers
    const openEditFloorModal = (floor: any) => {
        setEditFloorId(floor.id);
        setEditFloorNum(floor.floor_number);
        setOpenEditFloor(true);
    };

    const handleEditFloor = async () => {
        if (!editFloorId || !editFloorNum) return;
        try {
            await updateFloorMutation({ floorId: editFloorId, floorNumber: editFloorNum });
            toast.success("Floor updated!");
            setOpenEditFloor(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to update floor");
        }
    };

    // Add Seat handlers
    const openAddSeatModal = (roomId: string, currentSeats: any[]) => {
        setAddSeatRoomId(roomId);
        setNewSeatNum(`B${(currentSeats?.length || 0) + 1}`);
        setOpenAddSeat(true);
    };

    const handleAddSeat = async () => {
        if (!addSeatRoomId || !newSeatNum) return;
        try {
            await addSeatMutation({ roomId: addSeatRoomId, seatNumber: newSeatNum });
            toast.success("Seat added!");
            setOpenAddSeat(false);
            setNewSeatNum("");
        } catch (e: any) {
            toast.error(e.message || "Failed to add seat");
        }
    };

    const onDeleteRoom = async () => {
        if (!roomToDelete) return;
        try {
            await deleteRoomMutation({ roomId: roomToDelete.id });
            toast.success("Flat deleted successfully");
            setRoomToDelete(null);
        } catch (e: any) {
            toast.error(e.message || "Failed to delete flat");
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-400">Loading Layout...</div>;

    return (
        <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/admin")}
                        className="rounded-full shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                            <span className="truncate">{building?.name}</span>
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm truncate">
                            {building?.address?.line_one}, {building?.address?.city?.name}
                        </p>
                    </div>
                </div>

                <Dialog open={openFloor} onOpenChange={setOpenFloor}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-blue-500/20 w-full sm:w-auto font-semibold">
                            <Plus className="w-4 h-4 mr-2" /> Add New Floor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
                        <DialogHeader>
                            <DialogTitle>Add Floor & Generate Layout</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4 text-left">
                            <div className="space-y-2">
                                <Label>Floor Label (e.g. 1st Floor, Ground)</Label>
                                <Input
                                    value={newFloorNum}
                                    onChange={(e) => setNewFloorNum(e.target.value)}
                                    placeholder="Floor 1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-4">
                                <div className="space-y-2">
                                    <Label>Number of Flats</Label>
                                    <Input
                                        type="number"
                                        value={newRoomCount}
                                        onChange={(e) => setNewRoomCount(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Beds per Flat</Label>
                                    <Input
                                        type="number"
                                        value={newBedsPerRoom}
                                        onChange={(e) => setNewBedsPerRoom(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 italic">
                                This will automatically generate flats and beds for this floor.
                            </p>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => setOpenFloor(false)} className="w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button onClick={addFloor} className="w-full sm:w-auto">
                                Save Floor & Layout
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Layout Mapping */}
            <div className="grid gap-4 sm:gap-6">
                {floors.map((floor) => (
                    <div
                        key={floor.id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:border-blue-200"
                    >
                        {/* Floor Header */}
                        <div className="bg-slate-50 p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                    <Layers className="w-4 h-4 text-emerald-600" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-base sm:text-lg">{floor.floor_number}</h3>
                                <Badge
                                    variant="secondary"
                                    className="bg-emerald-50 text-emerald-700 border-emerald-100"
                                >
                                    {floor.rooms?.length || 0} Flats
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                    onClick={() => openEditFloorModal(floor)}
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            {canManage && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 w-full sm:w-auto font-medium"
                                    onClick={() => {
                                        setSelectedFloor(floor.id);
                                        setOpenRoom(true);
                                    }}
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Flat
                                </Button>
                            )}
                        </div>

                        {/* Flats Grid */}
                        <div className="p-3 sm:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {floor.rooms?.map((room: any) => {
                                    const isRoomInSelectionMode = selectionModeRoomId === room.id;
                                    const roomSelectedCount = selectedSeats[room.id]?.size || 0;
                                    const selectableSeats =
                                        room.seats?.filter((s: any) => s.status === "AVAILABLE") || [];
                                    const isAllSelectableSelected =
                                        selectableSeats.length > 0 &&
                                        selectableSeats.every((s: any) => selectedSeats[room.id]?.has(s.id));

                                    return (
                                        <Card
                                            key={room.id}
                                            className="border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden"
                                        >
                                            <CardHeader className="p-3 sm:p-4 pb-2 flex flex-col justify-between space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                                                            <Hash className="w-3.5 h-3.5 text-blue-500" />
                                                        </div>
                                                        <CardTitle className="text-base font-bold">
                                                            Flat {room.room_number}
                                                        </CardTitle>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {canManage && !isRoomInSelectionMode && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 uppercase"
                                                                    onClick={() => setSelectionModeRoomId(room.id)}
                                                                >
                                                                    Select
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6"
                                                                    onClick={() => openAppEditRoom(room)}
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-red-500 hover:text-red-700"
                                                                    onClick={() => setRoomToDelete(room)}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Selection Menu Bar */}
                                                {isRoomInSelectionMode && (
                                                    <div className="flex items-center justify-between pt-1 pb-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 px-2 text-[10px] font-bold uppercase transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                                                                onClick={() => toggleSelectAll(room)}
                                                            >
                                                                {isAllSelectableSelected
                                                                    ? "Unselect All"
                                                                    : "Select All"}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 px-2 text-[10px] font-bold uppercase text-slate-500 transition-colors hover:bg-slate-100"
                                                                onClick={() => exitSelectionMode(room.id)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                        {roomSelectedCount > 0 && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-7 px-2 text-[10px] font-bold uppercase animate-in zoom-in-95"
                                                                onClick={() => handleBulkDelete(room.id)}
                                                            >
                                                                Delete ({roomSelectedCount})
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    <Badge
                                                        variant="info"
                                                        className="text-[10px] uppercase font-bold px-1.5 h-5"
                                                    >
                                                        {room.seats?.length} Seats
                                                    </Badge>
                                                    {room.room_types && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] uppercase h-5 text-slate-500 bg-white border-slate-200"
                                                        >
                                                            {room.room_types.name}
                                                        </Badge>
                                                    )}
                                                    {room.sharing_types && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] uppercase h-5 text-slate-500 bg-white border-slate-200"
                                                        >
                                                            {room.sharing_types.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>

                                            <CardContent className="p-3 sm:p-4 pt-2">
                                                <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                                                    {room.seats?.map((seat: any) => {
                                                        const isSelected = selectedSeats[room.id]?.has(seat.id);
                                                        const isOccupied = seat.status === "OCCUPIED";

                                                        return (
                                                            <div key={seat.id} className="relative group">
                                                                <div
                                                                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all relative ring-offset-2 ${
                                                                        isOccupied
                                                                            ? "bg-red-50 text-red-400 border border-red-100 opacity-60 cursor-not-allowed"
                                                                            : "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 cursor-pointer"
                                                                    } ${isSelected ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200 text-blue-600 scale-105" : ""}`}
                                                                    onClick={() => {
                                                                        if (isRoomInSelectionMode) {
                                                                            toggleSeatSelection(
                                                                                room.id,
                                                                                seat.id,
                                                                                isOccupied,
                                                                            );
                                                                        } else {
                                                                            if (isOccupied)
                                                                                toast.error(
                                                                                    "This bed is occupied and cannot be edited",
                                                                                );
                                                                            else openEditBedModal(seat);
                                                                        }
                                                                    }}
                                                                >
                                                                    {/* Checkbox Overlay in Selection Mode */}
                                                                    {isRoomInSelectionMode && (
                                                                        <div className="absolute -top-1.5 -left-1.5 z-10 animate-in zoom-in-50 duration-200">
                                                                            {isSelected ? (
                                                                                <CheckSquare className="w-5 h-5 text-blue-600 bg-white rounded-md shadow-sm" />
                                                                            ) : (
                                                                                <div
                                                                                    className={`w-5 h-5 bg-white rounded-md border shadow-sm flex items-center justify-center ${isOccupied ? "border-red-100 bg-red-50/50" : "border-slate-300 group-hover:border-blue-400"}`}
                                                                                >
                                                                                    {isOccupied && (
                                                                                        <X className="w-3 h-3 text-red-300" />
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    <Bed
                                                                        className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? "animate-bounce" : ""}`}
                                                                    />
                                                                    <span className="text-[8px] sm:text-[9px] font-bold uppercase mt-0.5">
                                                                        {seat.seat_number}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {(!room.seats || room.seats.length === 0) && (
                                                        <div className="text-[10px] text-slate-400 italic py-2 px-1">
                                                            No seats added yet.
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {(!floor.rooms || floor.rooms.length === 0) && (
                                    <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
                                        No flats here. Click "Add Flat" to begin setup.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Flat Modal */}
            <Dialog open={openRoom} onOpenChange={setOpenRoom}>
                <DialogContent className="max-w-[95vw] sm:max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Flat to Floor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 text-left">
                        <div className="space-y-2">
                            <Label>Flat Number / Name</Label>
                            <Input
                                value={newRoomNum}
                                onChange={(e) => setNewRoomNum(e.target.value)}
                                placeholder="e.g. 101, A1"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <Label>Flat Type</Label>
                                <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roomTypes.map((rt) => (
                                            <SelectItem key={rt.id} value={rt.id}>
                                                {rt.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Sharing Type</Label>
                                <Select
                                    value={selectedSharingType}
                                    onValueChange={(v) => {
                                        setSelectedSharingType(v);
                                        const st = sharingTypes.find((s) => s.id === v);
                                        if (st) setSeatsInRoom(String(st.capacity));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select sharing..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Custom Capacity</SelectItem>
                                        {sharingTypes.map((st) => (
                                            <SelectItem key={st.id} value={st.id}>
                                                {st.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Beds per Flat</Label>
                            <Input
                                type="number"
                                value={seatsInRoom}
                                onChange={(e) => setSeatsInRoom(e.target.value)}
                                disabled={selectedSharingType !== "" && selectedSharingType !== "none"}
                            />
                            {selectedSharingType !== "" && selectedSharingType !== "none" && (
                                <p className="text-[10px] text-blue-500 italic">
                                    Locked to {sharingTypes.find((s) => s.id === selectedSharingType)?.name} capacity
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setOpenRoom(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button onClick={onAddRoom} className="w-full sm:w-auto font-semibold">
                            Create Flat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Flat Modal */}
            <Dialog open={openEditRoom} onOpenChange={setOpenEditRoom}>
                <DialogContent className="max-w-[95vw] sm:max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Flat Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 text-left">
                        <div className="space-y-2">
                            <Label>Flat Number / Name</Label>
                            <Input
                                value={newRoomNum}
                                onChange={(e) => setNewRoomNum(e.target.value)}
                                placeholder="e.g. 101, A1"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <Label>Flat Type</Label>
                                <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Non-AC, AC..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {roomTypes.map((rt) => (
                                            <SelectItem key={rt.id} value={rt.id}>
                                                {rt.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Sharing Type</Label>
                                <Select
                                    value={selectedSharingType}
                                    onValueChange={(v) => {
                                        setSelectedSharingType(v);
                                        const st = sharingTypes.find((s) => s.id === v);
                                        if (st) setSeatsInRoom(String(st.capacity));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Single, Double..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {sharingTypes.map((st) => (
                                            <SelectItem key={st.id} value={st.id}>
                                                {st.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2 mt-4 pt-2 border-t">
                            <Label>Number of Seats (Beds)</Label>
                            <Input
                                type="number"
                                value={seatsInRoom}
                                onChange={(e) => setSeatsInRoom(e.target.value)}
                                disabled={selectedSharingType !== "" && selectedSharingType !== "none"}
                            />
                            {selectedSharingType !== "" && selectedSharingType !== "none" && (
                                <p className="text-[10px] text-blue-500 italic">
                                    Locked to {sharingTypes.find((s) => s.id === selectedSharingType)?.name} capacity
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setOpenEditRoom(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button onClick={handleEditRoomSubmit} className="w-full sm:w-auto font-semibold">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Bed Modal */}
            <Dialog open={openEditBed} onOpenChange={setOpenEditBed}>
                <DialogContent className="max-w-[95vw] sm:max-w-sm mx-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Bed {selectedBed?.seat_number}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Bed Label</Label>
                            <Input value={newBedNum} onChange={(e) => setNewBedNum(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-between w-full">
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (selectedBed?.status === "OCCUPIED") {
                                    toast.error("Cannot delete a bed that is currently occupied.");
                                    return;
                                }
                                handleDeleteBed(selectedBed.id, true);
                            }}
                            className="w-full sm:w-auto font-semibold shadow-red-500/20"
                        >
                            Delete Bed
                        </Button>
                        <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setOpenEditBed(false)}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleEditBed} className="w-full sm:w-auto font-semibold">
                                Update Bed
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Floor Modal */}
            <Dialog open={openEditFloor} onOpenChange={setOpenEditFloor}>
                <DialogContent className="max-w-[95vw] sm:max-w-sm mx-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Floor Label</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 pt-4 border-t mt-4">
                        <Input value={editFloorNum} onChange={(e) => setEditFloorNum(e.target.value)} />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setOpenEditFloor(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button onClick={handleEditFloor} className="w-full sm:w-auto font-semibold">
                            Update Floor
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Flat Deletion Warning Modal */}
            <AlertDialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
                <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            Strong Warning: Flat Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-2">
                            <p className="font-semibold text-slate-900">
                                Are you sure you want to delete{" "}
                                <span className="text-red-600">Flat {roomToDelete?.room_number}</span>?
                            </p>
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl space-y-3 font-medium">
                                <p className="text-sm">
                                    Deleting this flat will permanently delete all associated beds. If any beds are
                                    occupied, the residents will NOT be deleted. Their bed assignment will be removed
                                    and their status will be updated.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                        <AlertDialogCancel className="w-full sm:w-auto mt-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onDeleteRoom}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600 font-bold"
                        >
                            Confirm Permanent Deletion
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
