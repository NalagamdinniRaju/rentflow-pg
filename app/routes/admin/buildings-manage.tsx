import { useState, useEffect } from "react";
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
    IndianRupee,
    ChevronDown,
    ChevronRight,
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
    type FlatConfig,
} from "~/queries/buildings.query";
import { useRoomTypes } from "~/queries/room-types.query";
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

    // Accordion states
    const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
    const [activeFlatId, setActiveFlatId] = useState<string | null>(null);

    // Add Seat states
    const [openAddSeat, setOpenAddSeat] = useState(false);
    const [addSeatRoomId, setAddSeatRoomId] = useState<string | null>(null);
    const [newSeatNum, setNewSeatNum] = useState("");

    // Selection states
    const [selectionModeRoomId, setSelectionModeRoomId] = useState<string | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<Record<string, Set<string>>>({});
    const [openBulkActions, setOpenBulkActions] = useState(false);
    const [bulkRoomId, setBulkRoomId] = useState<string | null>(null);
    const [selectedSeatsForBulk, setSelectedSeatsForBulk] = useState<Set<string>>(new Set());

    const [roomToDelete, setRoomToDelete] = useState<any | null>(null);

    const [newFloorNum, setNewFloorNum] = useState("");
    const [newFlatCount, setNewFlatCount] = useState("3");
    const [generatedFlats, setGeneratedFlats] = useState<FlatConfig[]>([]);

    const [newRoomNum, setNewRoomNum] = useState("");
    const [seatsInRoom, setSeatsInRoom] = useState("4");
    const [selectedRoomType, setSelectedRoomType] = useState<string>("");
    const [selectedSharingType, setSelectedSharingType] = useState<string>("");

    // Per-flat rent states
    const [useCustomRent, setUseCustomRent] = useState(false);
    const [flatMonthlyRent, setFlatMonthlyRent] = useState("");
    const [flatDailyRent, setFlatDailyRent] = useState("");
    const [flatDepositAmount, setFlatDepositAmount] = useState("");

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

    const getEffectiveRent = (room: any) => {
        const hasCustom = room.custom_monthly_rent != null || room.custom_daily_rent != null || room.custom_deposit_amount != null;
        return {
            monthly: room.custom_monthly_rent != null ? Number(room.custom_monthly_rent) : (Number(building?.monthly_rent) || 0),
            daily: room.custom_daily_rent != null ? Number(room.custom_daily_rent) : (Number(building?.daily_rent) || 0),
            deposit: room.custom_deposit_amount != null ? Number(room.custom_deposit_amount) : (Number(building?.deposit_amount) || 0),
            isCustom: hasCustom
        }
    };

    // Mutations
    const { mutateAsync: addFloorMutation, isPending: addingFloor } = useAddFloor();
    const { mutateAsync: addRoomMutation } = useAddRoom();
    const { mutateAsync: updateRoomMutation } = useUpdateRoom();
    const { mutateAsync: updateBedMutation } = useUpdateBed();
    const { mutateAsync: deleteBedMutation } = useDeleteBed();
    const { mutateAsync: updateFloorMutation } = useUpdateFloor();
    const { mutateAsync: addSeatMutation } = useAddSeat();
    const { mutateAsync: deleteRoomMutation } = useDeleteRoom();
    const { mutateAsync: bulkDeleteSeatsMutation } = useBulkDeleteSeats();

    // Generate flat numbers based on floor label
    const generateFlats = () => {
        const count = Number(newFlatCount) || 0;
        if (count <= 0 || !newFloorNum) {
            toast.error("Enter floor label and flat count first");
            return;
        }
        const floorDigit = newFloorNum.replace(/\D/g, '') || '0';
        const flats: FlatConfig[] = Array.from({ length: count }).map((_, i) => ({
            flatNumber: `${floorDigit}${(i + 1).toString().padStart(2, '0')}`,
            beds: 4,
            useCustomRent: false,
            customMonthlyRent: undefined,
            customDailyRent: undefined,
            customDepositAmount: undefined,
            roomTypeId: '',
            sharingTypeId: '',
        }));
        setGeneratedFlats(flats);
    };

    const updateFlat = (index: number, updates: Partial<FlatConfig>) => {
        setGeneratedFlats(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
    };

    const addFloor = async () => {
        if (!newFloorNum || !id) return;
        if (generatedFlats.length === 0) {
            toast.error("Please generate flats first");
            return;
        }
        try {
            await addFloorMutation({
                buildingId: id,
                floorNumber: newFloorNum,
                flats: generatedFlats,
            });
            toast.success("Floor and flats created!");
            setOpenFloor(false);
            setNewFloorNum("");
            setNewFlatCount("3");
            setGeneratedFlats([]);
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
                customMonthlyRent: useCustomRent && flatMonthlyRent ? Number(flatMonthlyRent) : undefined,
                customDailyRent: useCustomRent && flatDailyRent ? Number(flatDailyRent) : undefined,
                customDepositAmount: useCustomRent && flatDepositAmount ? Number(flatDepositAmount) : undefined,
            });

            toast.success("Flat and beds added!");
            setOpenRoom(false);
            setNewRoomNum("");
            setSelectedRoomType("");
            setSelectedSharingType("");
            setUseCustomRent(false);
            setFlatMonthlyRent("");
            setFlatDailyRent("");
            setFlatDepositAmount("");
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
                customMonthlyRent: useCustomRent && flatMonthlyRent ? Number(flatMonthlyRent) : null,
                customDailyRent: useCustomRent && flatDailyRent ? Number(flatDailyRent) : null,
                customDepositAmount: useCustomRent && flatDepositAmount ? Number(flatDepositAmount) : null,
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
        const hasCustom = room.custom_monthly_rent != null || room.custom_daily_rent != null || room.custom_deposit_amount != null;
        setUseCustomRent(hasCustom);
        setFlatMonthlyRent(room.custom_monthly_rent ? String(room.custom_monthly_rent) : "");
        setFlatDailyRent(room.custom_daily_rent ? String(room.custom_daily_rent) : "");
        setFlatDepositAmount(room.custom_deposit_amount ? String(room.custom_deposit_amount) : "");
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

    const selectAllAvailable = (roomId: string, availableSeats: any[]) => {
        setSelectedSeats(prev => ({
            ...prev,
            [roomId]: new Set(availableSeats.map(s => s.id))
        }));
    };

    const clearSelection = (roomId: string) => {
        setSelectedSeats(prev => {
            const next = { ...prev };
            delete next[roomId];
            return next;
        });
    };

    const handleBulkDelete = async () => {
        if (!bulkRoomId) return;
        const seatIds = Array.from(selectedSeatsForBulk);
        if (seatIds.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${seatIds.length} selected beds?`)) return;

        try {
            await bulkDeleteSeatsMutation({ roomId: bulkRoomId, seatIds });
            toast.success(`${seatIds.length} beds deleted successfully`);
            clearSelection(bulkRoomId);
            setSelectionModeRoomId(null);
            setOpenBulkActions(false);
            setBulkRoomId(null);
        } catch (e: any) {
            toast.error(e.message || "Failed to delete beds");
        }
    };

    const exitSelectionMode = (roomId: string) => {
        setSelectionModeRoomId(null);
        clearSelection(roomId);
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

    const loading = loadingBuilding || loadingFloors;

    if (loading) return <div className="p-20 text-center text-slate-400">Loading Layout...</div>;
    if (!building) return <div className="p-20 text-center text-red-400">Building not found or failed to load.</div>;

    return (
        <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/admin/buildings")}
                        className="rounded-full shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                            <span className="truncate">{building.name || 'Unnamed Building'}</span>
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm truncate">
                            {building.address?.line_one || 'No address'}, {building.address?.city?.name || 'No city'}
                        </p>
                        {(building.monthly_rent || building.daily_rent || building.deposit_amount) && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Default: ₹{Number(building.monthly_rent || 0).toLocaleString()}/mo · ₹{Number(building.daily_rent || 0).toLocaleString()}/day · ₹{Number(building.deposit_amount || 0).toLocaleString()} dep
                            </p>
                        )}
                    </div>
                </div>

                <Dialog open={openFloor} onOpenChange={(v) => { setOpenFloor(v); if (!v) { setGeneratedFlats([]); setNewFloorNum(""); setNewFlatCount("3"); } }}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-blue-500/20 w-full sm:w-auto font-semibold">
                            <Plus className="w-4 h-4 mr-2" /> Add New Floor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Floor & Configure Flats</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4 text-left">
                            {/* Step 1: Floor inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-2 sm:col-span-1">
                                    <Label>Floor Label *</Label>
                                    <Input value={newFloorNum} onChange={(e) => setNewFloorNum(e.target.value)} placeholder="e.g. Floor 1" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Number of Flats</Label>
                                    <Input type="number" min="1" value={newFlatCount} onChange={(e) => setNewFlatCount(e.target.value)} />
                                </div>
                                <div className="flex items-end">
                                    <Button type="button" variant="outline" className="w-full font-semibold border-blue-200 text-blue-600 hover:bg-blue-50" onClick={generateFlats}>
                                        Generate Flats
                                    </Button>
                                </div>
                            </div>

                            {/* Step 3: Dynamic flat configuration */}
                            {generatedFlats.length > 0 && (
                                <div className="border-t pt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-bold text-slate-800">Configure Each Flat ({generatedFlats.length})</Label>
                                        <p className="text-[10px] text-slate-400">Default: ₹{Number(building?.monthly_rent || 0).toLocaleString()}/mo · ₹{Number(building?.daily_rent || 0).toLocaleString()}/day · ₹{Number(building?.deposit_amount || 0).toLocaleString()} dep</p>
                                    </div>
                                    {generatedFlats.map((flat, idx) => (
                                        <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-3 bg-slate-50/50">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[11px]">Flat Number</Label>
                                                    <Input value={flat.flatNumber} onChange={(e) => updateFlat(idx, { flatNumber: e.target.value })} className="h-8 text-sm" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[11px]">Beds</Label>
                                                    <Input type="number" min="0" value={flat.beds} onChange={(e) => updateFlat(idx, { beds: Number(e.target.value) })} className="h-8 text-sm" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[11px]">Flat Type</Label>
                                                    <Select value={flat.roomTypeId || ''} onValueChange={(v) => updateFlat(idx, { roomTypeId: v })}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Type..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None</SelectItem>
                                                            {roomTypes.map((rt: any) => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[11px]">Sharing</Label>
                                                    <Select value={flat.sharingTypeId || ''} onValueChange={(v) => { updateFlat(idx, { sharingTypeId: v }); const st = sharingTypes.find((s: any) => s.id === v); if (st) updateFlat(idx, { sharingTypeId: v, beds: st.capacity }); }}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sharing..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Custom</SelectItem>
                                                            {sharingTypes.map((st: any) => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                                <input type="checkbox" id={`custom-rent-${idx}`} checked={flat.useCustomRent} onChange={(e) => updateFlat(idx, { useCustomRent: e.target.checked, customMonthlyRent: e.target.checked ? flat.customMonthlyRent : undefined, customDailyRent: e.target.checked ? flat.customDailyRent : undefined, customDepositAmount: e.target.checked ? flat.customDepositAmount : undefined })} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                                                <label htmlFor={`custom-rent-${idx}`} className="text-xs font-medium text-slate-600">Use Rent Custom Values</label>
                                                {!flat.useCustomRent && <Badge className="text-[9px] h-4 bg-slate-100 text-slate-500 border-slate-200">Uses Building Default</Badge>}
                                            </div>
                                            {flat.useCustomRent && (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px]">Monthly Rent (₹)</Label>
                                                        <Input type="number" value={flat.customMonthlyRent || ''} onChange={(e) => updateFlat(idx, { customMonthlyRent: Number(e.target.value) || undefined })} className="h-8 text-sm" placeholder={String(Number(building?.monthly_rent || 0))} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px]">Daily Rent (₹)</Label>
                                                        <Input type="number" value={flat.customDailyRent || ''} onChange={(e) => updateFlat(idx, { customDailyRent: Number(e.target.value) || undefined })} className="h-8 text-sm" placeholder={String(Number(building?.daily_rent || 0))} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px]">Deposit (₹)</Label>
                                                        <Input type="number" value={flat.customDepositAmount || ''} onChange={(e) => updateFlat(idx, { customDepositAmount: Number(e.target.value) || undefined })} className="h-8 text-sm" placeholder={String(Number(building?.deposit_amount || 0))} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => { setOpenFloor(false); setGeneratedFlats([]); }} className="w-full sm:w-auto">Cancel</Button>
                            <Button onClick={addFloor} disabled={addingFloor || generatedFlats.length === 0} className="w-full sm:w-auto font-semibold">
                                {addingFloor ? 'Creating...' : `Save Floor & ${generatedFlats.length} Flats`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Layout Mapping */}
            <div className="grid gap-4 sm:gap-6">
                {floors.map((floor) => {
                    const isFloorActive = activeFloorId === floor.id;
                    return (
                        <div
                            key={floor.id}
                            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:border-blue-200"
                        >
                            {/* Floor Header */}
                            <div 
                                className={`group p-3 sm:p-4 border-b flex flex-row items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-colors ${
                                    isFloorActive ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'
                                }`}
                                onClick={() => {
                                    if (isFloorActive) {
                                        setActiveFloorId(null);
                                        setActiveFlatId(null);
                                    } else {
                                        setActiveFloorId(floor.id);
                                        setActiveFlatId(null);
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                        <Layers className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 overflow-hidden">
                                        <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">{floor.floor_number}</h3>
                                        <Badge
                                            variant="secondary"
                                            className="bg-emerald-50 text-emerald-700 border-emerald-100 self-start shrink-0"
                                        >
                                            {floor.rooms?.length || 0} Flats
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-slate-400 hover:text-blue-600 rounded-lg"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditFloorModal(floor);
                                        }}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    {canManage && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-9 border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 font-medium rounded-lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isFloorActive) {
                                                    setActiveFloorId(floor.id);
                                                    setActiveFlatId(null);
                                                }
                                                setSelectedFloor(floor.id);
                                                setNewRoomNum("");
                                                setUseCustomRent(false);
                                                setFlatMonthlyRent("");
                                                setFlatDailyRent("");
                                                setSelectedRoomType("");
                                                setSelectedSharingType("");
                                                setSeatsInRoom("4");
                                                setOpenRoom(true);
                                            }}
                                        >
                                            <Plus className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">Add Flat</span>
                                        </Button>
                                    )}
                                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${isFloorActive ? 'bg-slate-200/50' : 'bg-slate-100/50 group-hover:bg-slate-200/50 group-active:bg-slate-300/50'}`}>
                                        <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isFloorActive ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>
                            </div>

                            {/* Flats Grid */}
                            {isFloorActive && (
                                <div className="p-3 sm:p-6 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                {floor.rooms?.map((room: any) => {
                                    const isRoomInSelectionMode = selectionModeRoomId === room.id;
                                    const roomSelectedCount = selectedSeats[room.id]?.size || 0;
                                    const selectableSeats =
                                        room.seats?.filter((s: any) => s.status === "AVAILABLE") || [];
                                    const isAllSelectableSelected =
                                        selectableSeats.length > 0 &&
                                        selectableSeats.every((s: any) => selectedSeats[room.id]?.has(s.id));
                                    const rentInfo = getEffectiveRent(room);

                                    const isFlatActive = activeFlatId === room.id;

                                    return (
                                        <Card
                                            key={room.id}
                                            className="border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden"
                                        >
                                            <CardHeader 
                                                className={`p-3 sm:p-4 pb-3 flex flex-col space-y-3 cursor-pointer transition-colors ${
                                                    isFlatActive ? 'bg-slate-50/50' : 'hover:bg-slate-50'
                                                }`}
                                                onClick={() => {
                                                    if (isFlatActive) {
                                                        setActiveFlatId(null);
                                                    } else {
                                                        setActiveFlatId(room.id);
                                                    }
                                                }}
                                            >
                                                {/* Main Title & Toggle Row */}
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                            <Hash className="w-4 h-4 text-blue-500" />
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 overflow-hidden">
                                                            <CardTitle className="text-base font-bold truncate text-slate-800">
                                                                Flat {room.room_number}
                                                            </CardTitle>
                                                            <div className="flex gap-1.5 items-center">
                                                                <Badge
                                                                    variant="info"
                                                                    className="text-[10px] uppercase font-bold px-1.5 h-4.5 bg-blue-50 text-blue-600 border-blue-100"
                                                                >
                                                                    {room.seats?.length} Beds
                                                                </Badge>
                                                                {isFlatActive && (
                                                                    <span className="text-[10px] text-blue-500 font-bold animate-pulse">• OPEN</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {canManage && !isRoomInSelectionMode && (
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-9 px-3 text-[10px] font-bold text-blue-600 hover:bg-blue-100 uppercase rounded-lg"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectionModeRoomId(room.id);
                                                                    }}
                                                                >
                                                                    Select
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9 rounded-lg"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openAppEditRoom(room);
                                                                    }}
                                                                >
                                                                    <Pencil className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setRoomToDelete(room);
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                        <div className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${isFlatActive ? 'bg-slate-200/50 rotate-90 shadow-inner' : 'bg-slate-100/30 rotate-0'}`}>
                                                            <ChevronRight className={`w-5 h-5 text-slate-400 transition-colors ${isFlatActive ? 'text-blue-500' : ''}`} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Selection Menu Bar */}
                                                {isRoomInSelectionMode && (
                                                    <div className="flex items-center justify-between p-2 bg-blue-50/50 rounded-xl border border-blue-100/50 animate-in fade-in slide-in-from-top-1 duration-200" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 px-2 text-[10px] font-bold text-red-500 hover:bg-red-50 uppercase rounded-lg"
                                                                onClick={() => setSelectionModeRoomId(null)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <div className="h-4 w-[1px] bg-blue-200" />
                                                            <span className="text-[10px] font-bold text-blue-700 px-1">
                                                                {roomSelectedCount} Selected
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {roomSelectedCount > 0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 px-2 text-[10px] font-bold text-red-600 hover:bg-red-50 uppercase rounded-lg"
                                                                    onClick={() => clearSelection(room.id)}
                                                                >
                                                                    Clear
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-100 uppercase rounded-lg"
                                                                onClick={() =>
                                                                    isAllSelectableSelected
                                                                        ? clearSelection(room.id)
                                                                        : selectAllAvailable(room.id, selectableSeats)
                                                                }
                                                                disabled={selectableSeats.length === 0}
                                                            >
                                                                {isAllSelectableSelected ? "Deselect" : "Select All"}
                                                            </Button>
                                                            {roomSelectedCount > 0 && (
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    className="h-8 px-3 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white uppercase rounded-lg shadow-sm"
                                                                    onClick={() => {
                                                                        setSelectedSeatsForBulk(selectedSeats[room.id]);
                                                                        setBulkRoomId(room.id);
                                                                        setOpenBulkActions(true);
                                                                    }}
                                                                >
                                                                    Actions
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Info Bar (Badges & Rent) */}
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {room.room_types && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-[10px] uppercase h-5 text-slate-500 bg-white border-slate-200 shadow-tiny"
                                                            >
                                                                {room.room_types.name}
                                                            </Badge>
                                                        )}
                                                        {room.sharing_types && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-[10px] uppercase h-5 text-slate-500 bg-white border-slate-200 shadow-tiny"
                                                            >
                                                                {room.sharing_types.name}
                                                            </Badge>
                                                        )}
                                                        {rentInfo.isCustom ? (
                                                            <Badge className="text-[10px] uppercase h-5 bg-amber-50 text-amber-700 border-amber-200 shadow-tiny">
                                                                <IndianRupee className="w-2.5 h-2.5 mr-0.5" />Custom Rent
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="text-[10px] uppercase h-5 bg-slate-50 text-slate-500 border-slate-200 shadow-tiny">
                                                                Default Rent
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    {(rentInfo.monthly || rentInfo.daily || rentInfo.deposit) && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100/50 w-fit px-2 py-0.5 rounded-md border border-slate-200/50">
                                                            {rentInfo.monthly ? (
                                                                <span className="flex items-center font-medium">
                                                                    ₹{rentInfo.monthly.toLocaleString()}
                                                                    <span className="text-[9px] text-slate-400 ml-0.5 uppercase">/mo</span>
                                                                </span>
                                                            ) : null}
                                                            {(rentInfo.monthly && (rentInfo.daily || rentInfo.deposit)) ? <span className="text-slate-300">•</span> : null}
                                                            {rentInfo.daily ? (
                                                                <span className="flex items-center font-medium">
                                                                    ₹{rentInfo.daily.toLocaleString()}
                                                                    <span className="text-[9px] text-slate-400 ml-0.5 uppercase">/day</span>
                                                                </span>
                                                            ) : null}
                                                            {(rentInfo.daily && rentInfo.deposit) ? <span className="text-slate-300">•</span> : null}
                                                            {rentInfo.deposit ? (
                                                                <span className="flex items-center font-medium">
                                                                    ₹{rentInfo.deposit.toLocaleString()}
                                                                    <span className="text-[9px] text-slate-400 ml-0.5 uppercase">dep</span>
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardHeader>

                                            {isFlatActive && (
                                                <CardContent className="p-3 sm:p-4 pt-4 animate-in slide-in-from-top-2 fade-in duration-200 bg-white border-t border-slate-100">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                                                            <Label className="text-sm font-bold text-slate-800 uppercase tracking-tight">Manage Beds</Label>
                                                        </div>
                                                        {canManage && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-9 px-3 text-[11px] font-bold text-blue-600 hover:bg-blue-50 uppercase border-blue-200 shadow-sm rounded-lg"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setAddSeatRoomId(room.id);
                                                                    setNewSeatNum("");
                                                                    setOpenAddSeat(true);
                                                                }}
                                                            >
                                                                <Plus className="w-4 h-4 mr-1.5" /> Add Bed
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 sm:gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                                        {room.seats?.map((seat: any) => {
                                                            const isSelected = selectedSeats[room.id]?.has(seat.id);
                                                            const isOccupied = seat.status === "OCCUPIED";

                                                            return (
                                                                <div key={seat.id} className="relative group">
                                                                    <div
                                                                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center transition-all relative ring-offset-2 shadow-sm ${isOccupied
                                                                            ? "bg-white text-red-400 border border-red-50 opacity-60 cursor-not-allowed"
                                                                            : "bg-white text-emerald-600 border border-emerald-100 hover:border-emerald-300 hover:shadow-md cursor-pointer"
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
                                                                            <div className="absolute -top-2 -left-2 z-10 animate-in zoom-in-50 duration-200">
                                                                                {isSelected ? (
                                                                                    <CheckSquare className="w-6 h-6 text-blue-600 bg-white rounded-lg shadow-md" />
                                                                                ) : (
                                                                                    <div
                                                                                        className={`w-6 h-6 bg-white rounded-lg border shadow-sm flex items-center justify-center ${isOccupied ? "border-red-100 bg-red-50/50" : "border-slate-300 group-hover:border-blue-400"}`}
                                                                                    >
                                                                                        {isOccupied && (
                                                                                            <X className="w-3.5 h-3.5 text-red-300" />
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        <Bed
                                                                            className={`w-5 h-5 sm:w-6 sm:h-6 ${isSelected ? "animate-bounce" : ""}`}
                                                                        />
                                                                        <span className="text-[9px] sm:text-[10px] font-black uppercase mt-1">
                                                                            {seat.seat_number}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {(!room.seats || room.seats.length === 0) && (
                                                            <div className="text-xs text-slate-400 italic py-4 px-2 w-full text-center">
                                                                No beds found. Click "Add Bed" to set up this flat.
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            )}
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
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Flat Modal */}
            <Dialog open={openRoom} onOpenChange={setOpenRoom}>
                <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
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
                        </div>
                        <div className="space-y-2">
                            <Label>Beds per Flat</Label>
                            <Input
                                type="number"
                                value={seatsInRoom}
                                onChange={(e) => setSeatsInRoom(e.target.value)}
                            />
                        </div>

                        {/* Per-Flat Rent and Deposit Configuration */}
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <input type="checkbox" id="add-flat-custom-rent" checked={useCustomRent} onChange={(e) => { setUseCustomRent(e.target.checked); if (!e.target.checked) { setFlatMonthlyRent(""); setFlatDailyRent(""); setFlatDepositAmount(""); } }} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                                <label htmlFor="add-flat-custom-rent" className="text-sm font-semibold text-slate-700">Use Custom Values</label>
                                {!useCustomRent && <Badge className="text-[9px] h-4 bg-slate-100 text-slate-500 border-slate-200">Uses Building Default</Badge>}
                            </div>
                            {!useCustomRent && (
                                <p className="text-[10px] text-slate-500 mb-3">
                                    This flat will use building default rent: ₹{Number(building?.monthly_rent || 0).toLocaleString()}/mo · ₹{Number(building?.daily_rent || 0).toLocaleString()}/day
                                </p>
                            )}
                            {useCustomRent && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Monthly Rent (₹)</Label>
                                        <Input type="number" value={flatMonthlyRent} onChange={(e) => setFlatMonthlyRent(e.target.value)} placeholder={String(Number(building?.monthly_rent || 0))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Daily Rent (₹)</Label>
                                        <Input type="number" value={flatDailyRent} onChange={(e) => setFlatDailyRent(e.target.value)} placeholder={String(Number(building?.daily_rent || 0))} />
                                    </div>
                                </div>
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
                <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
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
                        </div>
                        <div className="space-y-2 mt-4 pt-2 border-t">
                            <Label>Number of Seats (Beds)</Label>
                            <Input
                                type="number"
                                value={seatsInRoom}
                                onChange={(e) => setSeatsInRoom(e.target.value)}
                            />
                        </div>

                        {/* Per-Flat Rent and Deposit Configuration */}
                        <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <input type="checkbox" id="edit-flat-custom-rent" checked={useCustomRent} onChange={(e) => { setUseCustomRent(e.target.checked); if (!e.target.checked) { setFlatMonthlyRent(""); setFlatDailyRent(""); setFlatDepositAmount(""); } }} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                                <label htmlFor="edit-flat-custom-rent" className="text-sm font-semibold text-slate-700">Use Custom Values</label>
                                {!useCustomRent && <Badge className="text-[9px] h-4 bg-slate-100 text-slate-500 border-slate-200">Uses Building Default</Badge>}
                            </div>
                            {!useCustomRent && (
                                <p className="text-[10px] text-slate-500 mb-3">
                                    This flat uses building default values: ₹{Number(building?.monthly_rent || 0).toLocaleString()}/mo · ₹{Number(building?.daily_rent || 0).toLocaleString()}/day
                                </p>
                            )}
                            {useCustomRent && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Monthly Rent (₹)</Label>
                                        <Input type="number" value={flatMonthlyRent} onChange={(e) => setFlatMonthlyRent(e.target.value)} placeholder={String(Number(building?.monthly_rent || 0))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Daily Rent (₹)</Label>
                                        <Input type="number" value={flatDailyRent} onChange={(e) => setFlatDailyRent(e.target.value)} placeholder={String(Number(building?.daily_rent || 0))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Deposit (₹)</Label>
                                        <Input type="number" value={flatDepositAmount} onChange={(e) => setFlatDepositAmount(e.target.value)} placeholder={String(Number(building?.deposit_amount || 0))} />
                                    </div>
                                </div>
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
            {/* Bulk Actions Modal */}
            <Dialog open={openBulkActions} onOpenChange={setOpenBulkActions}>
                <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
                    <DialogHeader>
                        <DialogTitle>Bulk Actions - {selectedSeatsForBulk.size} Beds Selected</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <p className="text-sm text-slate-500">
                            Perform actions on all selected available beds in this flat.
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                            <Button 
                                variant="destructive" 
                                className="w-full font-bold h-12"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Selected Beds
                            </Button>
                            {/* Potential for more bulk actions here like status update, type update, etc. */}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenBulkActions(false)} className="w-full">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
