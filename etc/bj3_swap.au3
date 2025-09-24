#include <AutoItConstants.au3>

Const $BEJEWELED_GRID_SIZE = 82
Const $BEJEWELED_GRID_START[2] = [334, 48]
Const $TITLEBAR_HEIGHT = 30
Const $X_OFFSET = 8;

Func DoSwap($cellA, $cellB)
	Local $aX = Int(StringRight($cellA, 1))
	Local $aY = Asc(StringUpper(StringLeft($cellA, 1))) - 64
	Local $bX = Int(StringRight($cellB, 1))
	Local $bY = Asc(StringUpper(StringLeft($cellB, 1))) - 64

	If $aX > 8 Or $bX > 8 Or $aY > 8 Or $bY > 8 Then
		Return
	EndIf
	If $aX < 1 Or $bX < 1 Or $aY < 1 Or $bY < 1 Then
		Return
	EndIf

	Local $diffA = Abs($aX - $bX)
	Local $diffB = Abs($aY - $bY)
	Local $isAdjacent = $diffA <= 1 And $diffB <= 1 And ($diffA <> $diffB)
	If Not $isAdjacent Then
		Return
	EndIf

	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	Local $initX = ($screen[0] + $BEJEWELED_GRID_START[0] + $X_OFFSET)
	Local $initY = ($screen[1] + $BEJEWELED_GRID_START[1] + $TITLEBAR_HEIGHT)
	Local $centerOffset = ($BEJEWELED_GRID_SIZE / 2)

	Local $posAX = $initX + ($BEJEWELED_GRID_SIZE * $aX) - $centerOffset
	Local $posAY = $initY + ($BEJEWELED_GRID_SIZE * $aY) - $centerOffset
	Local $posBX = $initX + ($BEJEWELED_GRID_SIZE * $bX) - $centerOffset
	Local $posBY = $initY + ($BEJEWELED_GRID_SIZE * $bY) - $centerOffset

	MouseClickDrag($MOUSE_CLICK_PRIMARY, $posAX, $posAY, $posBX, $posBY, 1)
EndFunc

Func ClickAtPosition($x, $y)
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + Abs($x), $screen[1] + $TITLEBAR_HEIGHT + Abs($y), 1, 0)
EndFunc

Func CancelSelection()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + ($X_OFFSET * 2), $screen[1] + ($TITLEBAR_HEIGHT * 2), 1, 0)
EndFunc

Func Unpause()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 763, $screen[1] + $TITLEBAR_HEIGHT + 574, 1, 0)
EndFunc

Func BackToMainMenu()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 558, $screen[1] + $TITLEBAR_HEIGHT + 574, 1, 0)
EndFunc

Func Pause()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 140, $screen[1] + $TITLEBAR_HEIGHT + 695, 1, 0)
EndFunc

Func DismissAchievement()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 512, $screen[1] + $TITLEBAR_HEIGHT + 685, 1, 0)
EndFunc

Func DismissNewModeDialog()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 512, $screen[1] + $TITLEBAR_HEIGHT + 450, 1, 0)
EndFunc

Func DismissResults()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 715, $screen[1] + $TITLEBAR_HEIGHT + 700, 1, 0)
EndFunc

Func DismissHowToPlay()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 520, $screen[1] + $TITLEBAR_HEIGHT + 675, 1, 0)
EndFunc

Func ShowHowToPlay()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 660, $screen[1] + $TITLEBAR_HEIGHT + 520, 1, 0)
EndFunc

Func ChooseClassic()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 195, $screen[1] + $TITLEBAR_HEIGHT + 160, 1, 0)
	Sleep(333)
	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 410, $screen[1] + $TITLEBAR_HEIGHT + 310, 1, 0)
EndFunc

Func ChooseZen()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 830, $screen[1] + $TITLEBAR_HEIGHT + 160, 1, 0)
EndFunc

Func ChooseLightning()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 195, $screen[1] + $TITLEBAR_HEIGHT + 580, 1, 0)
	Sleep(333)
	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 410, $screen[1] + $TITLEBAR_HEIGHT + 310, 1, 0)
EndFunc

Func ChooseQuest()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 830, $screen[1] + $TITLEBAR_HEIGHT + 580, 1, 0)
EndFunc

Func ChoosePoker()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 350, $screen[1] + $TITLEBAR_HEIGHT + 270, 1, 0)
	Sleep(333)
	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 410, $screen[1] + $TITLEBAR_HEIGHT + 310, 1, 0)
EndFunc

Func ChooseButterflies()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 670, $screen[1] + $TITLEBAR_HEIGHT + 270, 1, 0)
	Sleep(333)
	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 410, $screen[1] + $TITLEBAR_HEIGHT + 310, 1, 0)
EndFunc

Func ChooseIceStorm()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 350, $screen[1] + $TITLEBAR_HEIGHT + 455, 1, 0)
	Sleep(333)
	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 410, $screen[1] + $TITLEBAR_HEIGHT + 310, 1, 0)
EndFunc

Func ChooseDiamondMine()
	WinActivate("Bejeweled 3")
	WinWaitActive("Bejeweled 3")

	Local $screen = WinGetPos("[ACTIVE]")

	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 670, $screen[1] + $TITLEBAR_HEIGHT + 455, 1, 0)
	Sleep(333)
	MouseClick($MOUSE_CLICK_PRIMARY, $screen[0] + $X_OFFSET + 410, $screen[1] + $TITLEBAR_HEIGHT + 310, 1, 0)
EndFunc

Switch $CmdLine[1]
	Case "Cancel"
		CancelSelection()
	Case "DismissAchievement"
		DismissAchievement()
	Case "DismissNewModeDialog"
		DismissNewModeDialog()
	Case "DismissResults"
		DismissResults()
	Case "DismissHowToPlay"
		DismissHowToPlay()
		Unpause()
	Case "HowToPlay"
		Pause()
		ShowHowToPlay()
	Case "Pause"
		Pause()
	Case "Unpause"
		Unpause()
	Case "MainMenu"
		BackToMainMenu()
	Case "ChooseClassic"
		ChooseClassic()
	Case "ChooseZen"
		ChooseZen()
	Case "ChooseLightning"
		ChooseLightning()
	Case "ChooseQuest"
		ChooseQuest()
	Case "ChoosePoker"
		ChoosePoker()
	Case "ChooseButterflies"
		ChooseButterflies()
	Case "ChooseIceStorm"
		ChooseIceStorm()
	Case "ChooseDiamondMine"
		ChooseDiamondMine()
	Case "Click"
		ClickAtPosition($CmdLine[2], $CmdLine[3])
	Case Else
		DoSwap($CmdLine[1], $CmdLine[2])
EndSwitch