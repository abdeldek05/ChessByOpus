import numpy as np

def tank_mechanical_sizing(V, D, p, mat, lim, TANK=None):
    #-------------------------
    # Calculate thickness and mass of a pressure tank.
    
    # Parameters:
    # - V (float): Volume in liters
    # - D (float): Diameter in mm
    # - p (float): Internal pressure in bar
    # - mat (int): Material flag (1 = aluminum, 2 = titanium)
    # - lim (float): Minimum allowed thickness in mm
    # - TANK (dict, optional): Tank geometry from `tank_geometry`
    
    # Returns:
    # - TANK (dict): Updated with thicknesses and weights
   #--------------------------

    # If TANK not provided, create empty dict
    if TANK is None:
        TANK = {}

    # === Material properties ===
    if mat == 1:  # Aluminum
        S_w = 200 / 1.25  # MPa
        rho = 2.7e-6      # kg/mm³
        e_w = 0.8         # Weld efficiency
    elif mat == 2:  # Titanium
        S_w = 850 / 1.25  # MPa
        rho = 4.4e-6      # kg/mm³
        e_w = 0.8
    else:
        raise ValueError("Unsupported material: use 1 (aluminum) or 2 (titanium)")

    # === Unit conversion ===
    V_mm3 = V * 1e6      # liters → mm³
    p_MPa = p * 1e-1     # bar → MPa
    R = D / 2            # radius in mm

    # === Coefficient for knuckle stress ===
    K_c = 0.67

    # === Dome geometry ===
    V_d = (2 / 3) * np.pi * R**3  # one dome volume [mm³]

    # Crown thickness
    t_cr = (p_MPa * R) / (2 * S_w * e_w)
    TANK['t_cr'] = max(t_cr, lim)

    # Knuckle thickness
    t_kn = (K_c * p_MPa * R) / (S_w * e_w)
    TANK['t_kn'] = max(t_kn, lim)

    # Dome thickness
    t_d = (p_MPa * R * (K_c + 0.5)) / (2 * S_w)
    t_d = max(t_d, lim)
    TANK['t_d'] = t_d

    # Dome weight [kg]
    W_d = 2 * np.pi * R**2 * t_d * rho
    TANK['W_d'] = W_d

    # === Cylindrical part ===
    V_c = V_mm3 - 2 * V_d
    l_c = V_c / (np.pi * R**2)
    TANK['l_c'] = l_c

    # Cylinder thickness
    t_c = (p_MPa * R) / (S_w * e_w)
    t_c = max(t_c, lim)
    TANK['t_c'] = t_c

    # Cylinder weight [kg]
    W_c = 2 * np.pi * R * l_c * t_c * rho
    TANK['W_c'] = W_c

    # === Total weight ===
    TANK['W_t'] = W_c + 2 * W_d

    return TANK
