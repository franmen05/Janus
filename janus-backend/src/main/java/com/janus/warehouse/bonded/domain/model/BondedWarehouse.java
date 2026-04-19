package com.janus.warehouse.bonded.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "depositos")
public class BondedWarehouse extends BaseEntity {

    @Column(nullable = false, unique = true)
    public String code;

    @Column(nullable = false)
    public String name;

    @Column(columnDefinition = "TEXT")
    public String description;

    @Column(name = "secuencia")
    public Integer secuencia;

    @Column(name = "tipo_localizacion", length = 100)
    public String tipoLocalizacion;

    @Column(name = "centro_logistico", length = 200)
    public String centroLogistico;

    @Column(name = "ubicacion_area", length = 200)
    public String ubicacionArea;

    @Column(name = "pais_origen", length = 100)
    public String paisOrigen;

    @Column(nullable = false)
    public boolean active = true;
}
