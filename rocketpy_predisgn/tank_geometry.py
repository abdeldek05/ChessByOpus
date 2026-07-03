import numpy as np

def tank_geometry(V, D):
    #--------------------
    # Compute tank geometry from total volume and diameter.

    # Parameters:
    # - V: volume in liters
    # - D: diameter in millimeters

    # Returns:
    # - TANK: dict containing all geometric properties
    #--------------------------

    # --- Unit conversion ---
    V_m3 = V * 1e-3      # [m³]
    D_m = D * 1e-3       # [m]

    # --- Volumes ---
    V_d_m3 = (2/3) * np.pi * (D_m / 2)**3  # volume of one dome
    V_c_m3 = V_m3 - 2 * V_d_m3             # volume of cylindrical part

    # --- Lengths ---
    l_c_m = V_c_m3 / (np.pi * (D_m / 2)**2)  # cylinder length
    l_t_m = l_c_m + D_m                      # total length (with two domes)

    # --- Convert back to mm and liters for output consistency ---
    TANK = {
        'D': D,                 # [mm]
        'V': V,                 # [l]
        'V_d': V_d_m3 * 1e3,    # [l]
        'V_c': V_c_m3 * 1e3,    # [l]
        'l_c': l_c_m * 1e3,     # [mm]
        'l_t': l_t_m * 1e3      # [mm]
    }

    # --- Dome profile for plotting ---
    x_d = np.linspace( 0, D / 2, 10)      # [mm]
    y_d = np.sqrt((D / 2)**2 - x_d**2)    # [mm]
    x = np.concatenate([x_d, D/2 + TANK['l_c'] + x_d])
    y = np.concatenate([np.flip(y_d), y_d])        # left dome flipped, right dome as-is

    TANK['x'] = x
    TANK['y'] = y

    return TANK
